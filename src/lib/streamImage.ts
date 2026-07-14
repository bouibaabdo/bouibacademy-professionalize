import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";

type Payload =
  | { type: "image_generation.partial_image"; b64_json: string; partial_image_index: number }
  | { type: "image_generation.completed"; b64_json: string }
  | { type: "error"; error: { message: string } };

export async function streamImage(
  endpoint: string,
  prompt: string,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `فشل التوليد: ${res.status}`);
  }

  let sawCompleted = false;
  let streamError: string | undefined;
  let lastDataUrl: string | undefined;
  const parser = createParser({
    onEvent(event) {
      let payload: Payload | undefined;
      try {
        payload = JSON.parse(event.data) as Payload;
      } catch {
        return;
      }
      if (event.event === "error" || payload?.type === "error") {
        streamError =
          (payload as { error?: { message?: string } })?.error?.message ?? "فشل توليد الصورة";
        return;
      }
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed"
      )
        return;
      if (!payload || !("b64_json" in payload)) return;
      const isFinal = event.event === "image_generation.completed";
      const dataUrl = `data:image/png;base64,${payload.b64_json}`;
      lastDataUrl = dataUrl;
      flushSync(() => {
        onFrame(dataUrl, isFinal);
      });
      if (isFinal) sawCompleted = true;
    },
  });

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  if (streamError) throw new Error(streamError);
  if (!sawCompleted) {
    if (lastDataUrl) {
      flushSync(() => {
        onFrame(lastDataUrl!, true);
      });
      return;
    }
    throw new Error("لم يتم توليد أي صورة — حاول تعديل الوصف قليلاً");
  }
}
