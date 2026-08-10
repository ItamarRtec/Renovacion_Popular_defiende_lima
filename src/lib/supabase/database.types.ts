export type ParticipacionRol = "personero" | "miembro-mesa" | "ciudadano";

export type PlataformaRol = "personero" | "coordinador" | "administrador";

export type RegistroEstado =
  | "pendiente"
  | "capacitado"
  | "asignado"
  | "completado"
  | "rechazado";

export type RegistroOrigen = "defiende_lima" | "renovacion_popular";

export type ActaOrigen = "web" | "whatsapp";

export type RegistroInsert = {
  rol: ParticipacionRol;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  centro_votacion?: string | null;
  numero_mesa?: string | null;
  region?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  afiliado_rp?: boolean | null;
  experiencia_personero?: boolean;
  origen?: RegistroOrigen;
  estado?: RegistroEstado;
  user_id?: string | null;
  plataforma_rol?: PlataformaRol;
  coordinador_id?: string | null;
};

export type RegistroRow = RegistroInsert & {
  id: string;
  origen: RegistroOrigen;
  estado: RegistroEstado;
  user_id: string | null;
  plataforma_rol: PlataformaRol;
  coordinador_id: string | null;
  region: string | null;
  provincia: string | null;
  distrito: string | null;
  experiencia_personero: boolean;
  created_at: string;
  updated_at: string;
};

export type VideoRow = {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  orden: number;
  duracion_seg: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type VideoProgresoRow = {
  id: string;
  registro_id: string;
  video_id: string;
  visto: boolean;
  porcentaje: number;
  visto_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActaRow = {
  id: string;
  registro_id: string;
  storage_path: string;
  origen: ActaOrigen;
  created_at: string;
  updated_at: string;
};

export type DominioAccesoRow = {
  id: string;
  dominio: string;
  origen: RegistroOrigen;
  activo: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type DominioAccesoInsert = {
  dominio: string;
  origen?: RegistroOrigen;
  activo?: boolean;
  notas?: string | null;
};

export type VentanaAccesoRow = {
  id: number;
  abre_at: string | null;
  cierra_at: string | null;
  activa: boolean;
  updated_at: string;
};

export type VentanaAccesoUpdate = Partial<
  Pick<VentanaAccesoRow, "abre_at" | "cierra_at" | "activa">
>;

export type Database = {
  public: {
    Tables: {
      registros: {
        Row: RegistroRow;
        Insert: RegistroInsert;
        Update: Partial<RegistroInsert>;
        Relationships: [];
      };
      videos: {
        Row: VideoRow;
        Insert: Omit<VideoRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<VideoRow>;
        Relationships: [];
      };
      video_progresos: {
        Row: VideoProgresoRow;
        Insert: {
          registro_id: string;
          video_id: string;
          visto?: boolean;
          porcentaje?: number;
          visto_at?: string | null;
        };
        Update: Partial<
          Pick<VideoProgresoRow, "visto" | "porcentaje" | "visto_at">
        >;
        Relationships: [];
      };
      actas: {
        Row: ActaRow;
        Insert: {
          registro_id: string;
          storage_path: string;
          origen?: ActaOrigen;
        };
        Update: Partial<Pick<ActaRow, "storage_path" | "origen">>;
        Relationships: [];
      };
      ventana_acceso: {
        Row: VentanaAccesoRow;
        Insert: Partial<VentanaAccesoRow>;
        Update: VentanaAccesoUpdate;
        Relationships: [];
      };
      dominios_acceso: {
        Row: DominioAccesoRow;
        Insert: DominioAccesoInsert;
        Update: Partial<DominioAccesoInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      link_registro_user: {
        Args: Record<string, never>;
        Returns: RegistroRow;
      };
      refresh_registro_capacitado: {
        Args: { p_registro_id: string };
        Returns: undefined;
      };
      registro_login_match: {
        Args: { p_dni: string; p_email: string };
        Returns: boolean;
      };
      current_registro: {
        Args: Record<string, never>;
        Returns: RegistroRow;
      };
      current_plataforma_rol: {
        Args: Record<string, never>;
        Returns: PlataformaRol;
      };
      registro_visible_to_caller: {
        Args: { p_id: string };
        Returns: boolean;
      };
      acceso_publico_abierto: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      rate_limit_hit: {
        Args: {
          p_clave: string;
          p_max: number;
          p_ventana_secs: number;
          p_lock_secs: number;
        };
        Returns: boolean;
      };
      rate_limit_state: {
        Args: { p_clave: string };
        Returns: boolean;
      };
    };
    Enums: {
      participacion_rol: ParticipacionRol;
      registro_estado: RegistroEstado;
      registro_origen: RegistroOrigen;
      plataforma_rol: PlataformaRol;
    };
    CompositeTypes: Record<string, never>;
  };
};
