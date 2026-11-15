-- Seed trains & stations for MVP / demo
insert into public.stations (id, code, name) values
  ('11111111-1111-1111-1111-111111111111', 'SC', 'Secunderabad'),
  ('22222222-2222-2222-2222-222222222222', 'KZJ', 'Kazipet'),
  ('33333333-3333-3333-3333-333333333333', 'WL', 'Warangal'),
  ('44444444-4444-4444-4444-444444444444', 'NGP', 'Nagpur'),
  ('55555555-5555-5555-5555-555555555555', 'BPL', 'Bhopal'),
  ('66666666-6666-6666-6666-666666666666', 'NDLS', 'New Delhi'),
  ('77777777-7777-7777-7777-777777777777', 'CSMT', 'Mumbai CSMT'),
  ('88888888-8888-8888-8888-888888888888', 'BCT', 'Mumbai Central')
on conflict (code) do nothing;

insert into public.trains (id, number, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12723', 'Telangana Express'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '12951', 'Mumbai Rajdhani')
on conflict (number) do nothing;

insert into public.train_routes (id, train_id) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
on conflict (train_id) do nothing;

insert into public.train_route_stops (route_id, station_id, stop_index) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 0),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 2),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 3),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 4),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', 5),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '88888888-8888-8888-8888-888888888888', 0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', 1),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '66666666-6666-6666-6666-666666666666', 2)
on conflict do nothing;
