select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'fighters'
    and column_name = 'is_valid_build'
) as column_exists;
