export type ParticipacionRol = "personero" | "miembro-mesa" | "ciudadano";

export type PlataformaRol = "personero" | "coordinador" | "administrador";

export type RegistroEstado =
  | "pendiente"
  | "capacitado"
  | "asignado"
  | "completado"
  | "rechazado";

export type RegistroOrigen = "defiende_lima" | "renovacion_popular";

export type RolMesa = "titular" | "suplente";

export type ActaOrigen = "web" | "whatsapp";

export type ActaTipo = "instalacion_sufragio" | "escrutinio";

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
  rol_mesa?: RolMesa;
  user_id?: string | null;
  plataforma_rol?: PlataformaRol;
  coordinador_id?: string | null;
};

export type RegistroRow = RegistroInsert & {
  id: string;
  origen: RegistroOrigen;
  estado: RegistroEstado;
  rol_mesa: RolMesa;
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
  tipo: ActaTipo;
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

export type AsistenciaMetodo = "qr" | "manual";

export type AsistenciaRow = {
  id: string;
  registro_id: string;
  coordinador_id: string;
  llegada_at: string;
  metodo: AsistenciaMetodo;
  evento_id: string | null;
  created_at: string;
};

export type EventoTipo = "ensayo" | "eleccion";

export type EventoRow = {
  id: string;
  nombre: string;
  tipo: EventoTipo;
  abre_at: string | null;
  cierra_at: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type EventoInsert = {
  nombre: string;
  tipo?: EventoTipo;
  abre_at?: string | null;
  cierra_at?: string | null;
  activo?: boolean;
};

export type AdministradorRow = {
  id: string;
  usuario: string;
  password_hash: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type AdministradorInsert = {
  usuario: string;
  password_hash: string;
  nombre?: string;
  activo?: boolean;
};

export type Database = {
  public: {
    Tables: {
      administradores: {
        Row: AdministradorRow;
        Insert: AdministradorInsert;
        Update: Partial<AdministradorInsert>;
        Relationships: [];
      };
      registros: {
        Row: RegistroRow;
        Insert: RegistroInsert;
        Update: Partial<RegistroInsert>;
        Relationships: [];
      };
      videos: {
        Row: VideoRow;
        Insert: {
          titulo: string;
          url: string;
          descripcion?: string;
          orden?: number;
          duracion_seg?: number | null;
          activo?: boolean;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            VideoRow,
            | "titulo"
            | "descripcion"
            | "url"
            | "orden"
            | "duracion_seg"
            | "activo"
          >
        >;
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
          tipo?: ActaTipo;
        };
        Update: Partial<Pick<ActaRow, "storage_path" | "origen" | "tipo">>;
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
      asistencias: {
        Row: AsistenciaRow;
        Insert: {
          registro_id: string;
          coordinador_id: string;
          metodo?: AsistenciaMetodo;
          llegada_at?: string;
          evento_id?: string | null;
        };
        Update: Partial<
          Pick<
            AsistenciaRow,
            "metodo" | "llegada_at" | "coordinador_id" | "evento_id"
          >
        >;
        Relationships: [];
      };
      eventos: {
        Row: EventoRow;
        Insert: EventoInsert;
        Update: Partial<EventoInsert>;
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
      registrar_asistencia: {
        Args: {
          p_registro_id: string;
          p_metodo?: string;
          p_evento_id?: string;
        };
        Returns: Record<string, unknown>;
      };
      evento_activo_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: {
      participacion_rol: ParticipacionRol;
      registro_estado: RegistroEstado;
      registro_origen: RegistroOrigen;
      plataforma_rol: PlataformaRol;
      rol_mesa: RolMesa;
    };
    CompositeTypes: Record<string, never>;
  };
};
