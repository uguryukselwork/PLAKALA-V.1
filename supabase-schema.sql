-- ==========================================================
-- Plakala / Parkla Supabase Veritabanı Şeması
-- Bu SQL kodlarını Supabase Dashboard -> SQL Editor alanına
-- yapıştırıp "Run" butonuna basarak veritabanınızı oluşturabilirsiniz.
-- ==========================================================

-- 1. Araç Kayıtları Tablosu (cars)
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate VARCHAR(20) NOT NULL UNIQUE,
  recovery_code VARCHAR(20) NOT NULL,
  device_id TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sohbet Odaları Tablosu (rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) NOT NULL UNIQUE,
  target_plate VARCHAR(20) NOT NULL,
  sender_device_id TEXT,
  target_device_id TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mesajlar Tablosu (messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) NOT NULL,
  plate VARCHAR(20) NOT NULL,
  sender_id TEXT NOT NULL,
  sender_photo TEXT,
  sender_gender VARCHAR(20) DEFAULT 'unspecified',
  text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler (Hızlı arama ve eşleştirme için)
CREATE INDEX IF NOT EXISTS idx_cars_plate ON public.cars(plate);
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_target_plate ON public.rooms(target_plate);
CREATE INDEX IF NOT EXISTS idx_messages_room_code ON public.messages(room_code);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- 4. Row Level Security (RLS) Politikaları (Anonim & Açık Erişim)
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes plaka sorgulayabilir ve araç ekleyebilir"
  ON public.cars FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Herkes oda oluşturabilir ve katılabilir"
  ON public.rooms FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Herkes odalarda mesajlaşabilir"
  ON public.messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Realtime Yayınını Etkinleştir
ALTER PUBLICATION supabase_realtime ADD TABLE public.cars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
