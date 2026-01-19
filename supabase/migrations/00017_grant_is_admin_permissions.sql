
-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO public;
