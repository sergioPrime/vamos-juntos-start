-- Remover as organizações duplicadas que foram criadas incorretamente
-- Manter apenas a organização principal que tem a empresa padrão

-- Primeiro, remover as associações de usuários com organizações duplicadas
DELETE FROM user_organizations 
WHERE org_id IN (
  '112b3fd3-6c66-41f5-bfef-c8cec10d9915',
  '2893168e-5f58-4c2d-8f6f-633a4510898a', 
  'ae2bbb72-148a-4402-875d-30825843fd25',
  '4e7c659d-0d20-4376-8f3f-d7cd0153db86',
  '9bbf5c3b-c549-495a-838d-5fc52bd765bf'
);

-- Depois remover as organizações duplicadas
DELETE FROM organizations 
WHERE id IN (
  '112b3fd3-6c66-41f5-bfef-c8cec10d9915',
  '2893168e-5f58-4c2d-8f6f-633a4510898a', 
  'ae2bbb72-148a-4402-875d-30825843fd25',
  '4e7c659d-0d20-4376-8f3f-d7cd0153db86',
  '9bbf5c3b-c549-495a-838d-5fc52bd765bf'
);