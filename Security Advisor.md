[
  {
    "name": "policy_exists_rls_disabled",
    "title": "Policy Exists RLS Disabled",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) policies have been created, but RLS has not been enabled for the underlying table.",
    "detail": "Table \\`public.audit_logs\\` has RLS policies but RLS is not enabled on the table. Policies include {super_admin_select}.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled",
    "metadata": {
      "name": "audit_logs",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "policy_exists_rls_disabled_public_audit_logs"
  },
  {
    "name": "policy_exists_rls_disabled",
    "title": "Policy Exists RLS Disabled",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) policies have been created, but RLS has not been enabled for the underlying table.",
    "detail": "Table \\`public.classrooms\\` has RLS policies but RLS is not enabled on the table. Policies include {\"Allow public read for testing\"}.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled",
    "metadata": {
      "name": "classrooms",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "policy_exists_rls_disabled_public_classrooms"
  },
  {
    "name": "policy_exists_rls_disabled",
    "title": "Policy Exists RLS Disabled",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) policies have been created, but RLS has not been enabled for the underlying table.",
    "detail": "Table \\`public.students\\` has RLS policies but RLS is not enabled on the table. Policies include {\"Allow public read for testing\"}.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled",
    "metadata": {
      "name": "students",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "policy_exists_rls_disabled_public_students"
  },
  {
    "name": "policy_exists_rls_disabled",
    "title": "Policy Exists RLS Disabled",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) policies have been created, but RLS has not been enabled for the underlying table.",
    "detail": "Table \\`public.subjects\\` has RLS policies but RLS is not enabled on the table. Policies include {\"Allow public read for testing\"}.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled",
    "metadata": {
      "name": "subjects",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "policy_exists_rls_disabled_public_subjects"
  },
  {
    "name": "policy_exists_rls_disabled",
    "title": "Policy Exists RLS Disabled",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) policies have been created, but RLS has not been enabled for the underlying table.",
    "detail": "Table \\`public.teachers\\` has RLS policies but RLS is not enabled on the table. Policies include {\"Allow public read for testing\"}.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled",
    "metadata": {
      "name": "teachers",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "policy_exists_rls_disabled_public_teachers"
  },
  {
    "name": "security_definer_view",
    "title": "Security Definer View",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects views defined with the SECURITY DEFINER property. These views enforce Postgres permissions and row level security policies (RLS) of the view creator, rather than that of the querying user",
    "detail": "View \\`public.active_students\\` is defined with the SECURITY DEFINER property",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view",
    "metadata": {
      "name": "active_students",
      "type": "view",
      "schema": "public"
    },
    "cache_key": "security_definer_view_public_active_students"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.audit_logs\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "audit_logs",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_audit_logs"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_group_memberships\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_group_memberships",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_group_memberships"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.activity_groups\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "activity_groups",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_activity_groups"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.activity_group_members\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "activity_group_members",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_activity_group_members"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.subjects\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "subjects",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_subjects"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teachers\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teachers",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teachers"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.parents\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "parents",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_parents"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.students\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "students",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_students"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.schedules\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "schedules",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_schedules"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.users\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "users",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_users"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.attendance_sessions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "attendance_sessions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_attendance_sessions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.classrooms\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "classrooms",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_classrooms"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.attendance\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "attendance",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_attendance"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.homeroom_attendance\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "homeroom_attendance",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_homeroom_attendance"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.leave_requests\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "leave_requests",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_leave_requests"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.notifications\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "notifications",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_notifications"
  },
  {
    "name": "sensitive_columns_exposed",
    "title": "Sensitive Columns Exposed",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects tables exposed via API that contain columns with potentially sensitive data (PII, credentials, financial info) without RLS protection.",
    "detail": "Table `public.attendance` is exposed via API without RLS and contains potentially sensitive column(s): session_id. This may lead to data exposure.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0023_sensitive_columns_exposed",
    "metadata": {
      "name": "attendance",
      "type": "table",
      "schema": "public",
      "matched_patterns": [
        "session_id"
      ],
      "sensitive_columns": [
        "session_id"
      ]
    },
    "cache_key": "sensitive_columns_exposed_public_attendance"
  }
]