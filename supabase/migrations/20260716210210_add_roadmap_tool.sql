INSERT INTO public.admin_ai_tools (tool_key, title, enabled, sort_order)
VALUES ('roadmap', 'مستشار مسارات التعلم (Roadmap)', true, 6)
ON CONFLICT (tool_key) DO NOTHING;
