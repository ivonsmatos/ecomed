export interface MapPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  photoUrl: string | null;
  residueTypes: string[];
  schedules?: Array<{
    dayOfWeek: number;
    opens: string;
    closes: string;
    closed: boolean;
  }>;
  distancia_metros?: number;
}
