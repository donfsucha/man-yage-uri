alter table public.analytics_events
  drop constraint if exists analytics_events_event_name_check;

alter table public.analytics_events
  add constraint analytics_events_event_name_check
  check (
    event_name in (
      'create_page_view',
      'landing_view',
      'story_start',
      'story_validation_error',
      'preview_generated',
      'preview_failed',
      'choice_selected',
      'checkout_view',
      'checkout_click',
      'payment_started',
      'payment_success',
      'payment_failed',
      'payment_canceled',
      'story_completed_view',
      'bonus_download',
      'language_changed'
    )
  );
