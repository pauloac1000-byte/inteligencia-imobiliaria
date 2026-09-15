-- Cleanup migration to delete temporary test rows inserted during verification
DELETE FROM public.compatibilidade_imovel_tese WHERE lead_venda_id = 'd6f845b7-7bd3-43ae-aa68-e78b068878e3'::uuid OR lead_investidor_id = 'f39e78ce-bedd-4cc7-88cc-d9e8e3b2cd1b'::uuid;
DELETE FROM public.lead_arquivos WHERE lead_id = 'd6f845b7-7bd3-43ae-aa68-e78b068878e3'::uuid;
DELETE FROM public.leads_venda WHERE id = 'd6f845b7-7bd3-43ae-aa68-e78b068878e3'::uuid;
DELETE FROM public.leads_investidor WHERE id = 'f39e78ce-bedd-4cc7-88cc-d9e8e3b2cd1b'::uuid;
