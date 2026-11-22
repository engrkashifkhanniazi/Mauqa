update jobs set slug = trim(both '-' from regexp_replace(lower(slug), '[^a-z0-9]+', '-', 'g')) where slug ~ '[^a-z0-9-]'
