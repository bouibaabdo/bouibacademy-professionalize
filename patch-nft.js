import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(__dirname, 'node_modules', 'nf3', 'dist', '_chunks', 'trace.mjs');

if (fs.existsSync(targetFile)) {
  console.log(`[postinstall-patch] Found target file: ${targetFile}`);
  try {
    let content = fs.readFileSync(targetFile, 'utf8');
    
    // Check if it's already patched
    if (content.includes('import nft from "@vercel/nft"')) {
      console.log('[postinstall-patch] File is already patched.');
      process.exit(0);
    }
    
    const targetString = 'import { nodeFileTrace } from "@vercel/nft";';
    const replacementString = 'import nft from "@vercel/nft";\nconst { nodeFileTrace } = nft;';
    
    if (content.includes(targetString)) {
      content = content.replace(targetString, replacementString);
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log('[postinstall-patch] Successfully patched trace.mjs!');
    } else {
      console.warn('[postinstall-patch] Target string not found in trace.mjs. It might have changed or been patched.');
    }
  } catch (error) {
    console.error('[postinstall-patch] Error patching file:', error);
  }
} else {
  console.log(`[postinstall-patch] Target file does not exist (nf3 might not be installed yet): ${targetFile}`);
}
