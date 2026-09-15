// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      leads_investidor: {
        Row: {
          cidades_interesse: string | null
          criado_em: string | null
          email: string | null
          faixa_valor: string | null
          id: string
          nome: string | null
          objetivo: string | null
          perfil: string | null
          prazo_decisao: string | null
          protocolo: string | null
          rota: string
          sim_aluguel_mensal: string | null
          sim_capital_investido: string | null
          sim_custo_reforma: string | null
          sim_prazo_revenda_meses: number | null
          sim_rentabilidade_mensal: number | null
          sim_retorno_total: number | null
          sim_valor_compra: string | null
          sim_valorizacao_anual: number | null
          telefone: string
          ticket: string | null
        }
        Insert: {
          cidades_interesse?: string | null
          criado_em?: string | null
          email?: string | null
          faixa_valor?: string | null
          id?: string
          nome?: string | null
          objetivo?: string | null
          perfil?: string | null
          prazo_decisao?: string | null
          protocolo?: string | null
          rota?: string
          sim_aluguel_mensal?: string | null
          sim_capital_investido?: string | null
          sim_custo_reforma?: string | null
          sim_prazo_revenda_meses?: number | null
          sim_rentabilidade_mensal?: number | null
          sim_retorno_total?: number | null
          sim_valor_compra?: string | null
          sim_valorizacao_anual?: number | null
          telefone: string
          ticket?: string | null
        }
        Update: {
          cidades_interesse?: string | null
          criado_em?: string | null
          email?: string | null
          faixa_valor?: string | null
          id?: string
          nome?: string | null
          objetivo?: string | null
          perfil?: string | null
          prazo_decisao?: string | null
          protocolo?: string | null
          rota?: string
          sim_aluguel_mensal?: string | null
          sim_capital_investido?: string | null
          sim_custo_reforma?: string | null
          sim_prazo_revenda_meses?: number | null
          sim_rentabilidade_mensal?: number | null
          sim_retorno_total?: number | null
          sim_valor_compra?: string | null
          sim_valorizacao_anual?: number | null
          telefone?: string
          ticket?: string | null
        }
        Relationships: []
      }
      leads_venda: {
        Row: {
          calc_condominio_mensal: string | null
          calc_custo_acumulado_total: string | null
          calc_custo_mensal_total: string | null
          calc_iptu_anual: string | null
          calc_manutencao_mensal: string | null
          calc_meses_parado: number | null
          calc_taxa_mensal: number | null
          cidade: string | null
          criado_em: string | null
          email: string | null
          id: string
          mensagem: string | null
          motivo_venda: string | null
          nome: string | null
          prazo_desejado: string | null
          protocolo: string | null
          rota: string
          status: string
          telefone: string
          tipo_imovel: string | null
          user_id: string | null
          valor_estimado: string | null
        }
        Insert: {
          calc_condominio_mensal?: string | null
          calc_custo_acumulado_total?: string | null
          calc_custo_mensal_total?: string | null
          calc_iptu_anual?: string | null
          calc_manutencao_mensal?: string | null
          calc_meses_parado?: number | null
          calc_taxa_mensal?: number | null
          cidade?: string | null
          criado_em?: string | null
          email?: string | null
          id?: string
          mensagem?: string | null
          motivo_venda?: string | null
          nome?: string | null
          prazo_desejado?: string | null
          protocolo?: string | null
          rota?: string
          status?: string
          telefone: string
          tipo_imovel?: string | null
          user_id?: string | null
          valor_estimado?: string | null
        }
        Update: {
          calc_condominio_mensal?: string | null
          calc_custo_acumulado_total?: string | null
          calc_custo_mensal_total?: string | null
          calc_iptu_anual?: string | null
          calc_manutencao_mensal?: string | null
          calc_meses_parado?: number | null
          calc_taxa_mensal?: number | null
          cidade?: string | null
          criado_em?: string | null
          email?: string | null
          id?: string
          mensagem?: string | null
          motivo_venda?: string | null
          nome?: string | null
          prazo_desejado?: string | null
          protocolo?: string | null
          rota?: string
          status?: string
          telefone?: string
          tipo_imovel?: string | null
          user_id?: string | null
          valor_estimado?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          tipo: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_submit_lead_calculadora: {
        Args: {
          p_cidade: string
          p_condominio_mensal?: string
          p_custo_acumulado_total?: string
          p_custo_mensal_total?: string
          p_iptu_anual?: string
          p_manutencao_mensal?: string
          p_meses_parado?: number
          p_rota?: string
          p_taxa_mensal?: number
          p_telefone: string
          p_valor_imovel: string
        }
        Returns: {
          id: string
          protocolo: string
        }[]
      }
      fn_submit_lead_investidor: {
        Args: {
          p_cidades_interesse: string
          p_email?: string
          p_faixa_valor?: string
          p_nome?: string
          p_objetivo: string
          p_perfil?: string
          p_prazo_decisao: string
          p_rota?: string
          p_telefone: string
          p_ticket: string
        }
        Returns: {
          id: string
          protocolo: string
        }[]
      }
      fn_submit_lead_simulador_investidor: {
        Args: {
          p_cidade: string
          p_rota?: string
          p_sim_aluguel_mensal?: string
          p_sim_capital_investido?: string
          p_sim_custo_reforma?: string
          p_sim_prazo_revenda_meses?: number
          p_sim_rentabilidade_mensal?: number
          p_sim_retorno_total?: number
          p_sim_valor_compra: string
          p_sim_valorizacao_anual?: number
          p_telefone: string
        }
        Returns: {
          id: string
          protocolo: string
        }[]
      }
      fn_submit_lead_venda: {
        Args: {
          p_cidade: string
          p_email?: string
          p_id?: string
          p_mensagem?: string
          p_motivo_venda?: string
          p_nome?: string
          p_prazo_desejado?: string
          p_rota?: string
          p_telefone: string
          p_tipo_imovel: string
          p_valor_estimado?: string
        }
        Returns: {
          id: string
          protocolo: string
        }[]
      }
      fn_submit_lead_venda_etapa1: {
        Args: {
          p_cidade: string
          p_rota?: string
          p_telefone: string
          p_tipo_imovel: string
        }
        Returns: {
          id: string
          protocolo: string
        }[]
      }
      fn_submit_lead_venda_etapa2: {
        Args: {
          p_email: string
          p_id: string
          p_mensagem?: string
          p_motivo_venda: string
          p_nome: string
          p_prazo_desejado: string
          p_valor_estimado?: string
        }
        Returns: {
          id: string
          protocolo: string
        }[]
      }
      fn_vincular_lead_por_email: {
        Args: { p_email: string; p_user_id: string }
        Returns: {
          protocolos: string[]
          total_vinculados: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
