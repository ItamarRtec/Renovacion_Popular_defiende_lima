export type ParticipacionRol = "personero" | "miembro-mesa" | "ciudadano";

export type RegistroEstado =
  | "pendiente"
  | "capacitado"
  | "asignado"
  | "completado"
  | "rechazado";

export type RegistroOrigen = "defiende_lima" | "renovacion_popular";

export type RegistroInsert = {
  rol: ParticipacionRol;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  centro_votacion?: string | null;
  numero_mesa?: string | null;
  region: string;
  provincia: string;
  distrito: string;
  afiliado_rp?: boolean | null;
  experiencia_personero: boolean;
  origen?: RegistroOrigen;
  estado?: RegistroEstado;
};

export type RegistroRow = RegistroInsert & {
  id: string;
  origen: RegistroOrigen;
  estado: RegistroEstado;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      registros: {
        Row: RegistroRow;
        Insert: RegistroInsert;
        Update: Partial<RegistroInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      participacion_rol: ParticipacionRol;
      registro_estado: RegistroEstado;
      registro_origen: RegistroOrigen;
    };
    CompositeTypes: Record<string, never>;
  };
};
