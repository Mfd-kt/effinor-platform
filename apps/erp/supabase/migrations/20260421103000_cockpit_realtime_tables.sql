-- Tables pilotées par le cockpit command (/cockpit) : événements Realtime pour refresh RSC.
ALTER PUBLICATION supabase_realtime ADD TABLE public.commercial_callbacks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_event_logs;
