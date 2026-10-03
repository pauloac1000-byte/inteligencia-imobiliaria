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
      compatibilidade_imovel_tese: {
        Row: {
          atualizado_em: string
          criado_em: string
          criterios_atendidos: Json
          criterios_nao_atendidos: Json
          id: string
          lead_investidor_id: string
          lead_venda_id: string
          percentual: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criterios_atendidos?: Json
          criterios_nao_atendidos?: Json
          id?: string
          lead_investidor_id: string
          lead_venda_id: string
          percentual?: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criterios_atendidos?: Json
          criterios_nao_atendidos?: Json
          id?: string
          lead_investidor_id?: string
          lead_venda_id?: string
          percentual?: number
        }
        Relationships: [
          {
            foreignKeyName: 'compatibilidade_imovel_tese_lead_investidor_id_fkey'
            columns: ['lead_investidor_id']
            isOneToOne: false
            referencedRelation: 'leads_investidor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'compatibilidade_imovel_tese_lead_venda_id_fkey'
            columns: ['lead_venda_id']
            isOneToOne: false
            referencedRelation: 'leads_venda'
            referencedColumns: ['id']
          },
        ]
      }
      compatibilidades: {
        Row: {
          atualizado_em: string
          criado_em: string
          criterios: Json
          criterios_atendidos: Json
          criterios_nao_atendidos: Json
          id: string
          lead_investidor_id: string
          lead_venda_id: string
          percentual: number
          status: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criterios?: Json
          criterios_atendidos?: Json
          criterios_nao_atendidos?: Json
          id?: string
          lead_investidor_id: string
          lead_venda_id: string
          percentual?: number
          status?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criterios?: Json
          criterios_atendidos?: Json
          criterios_nao_atendidos?: Json
          id?: string
          lead_investidor_id?: string
          lead_venda_id?: string
          percentual?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'compatibilidades_lead_investidor_id_fkey'
            columns: ['lead_investidor_id']
            isOneToOne: false
            referencedRelation: 'leads_investidor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'compatibilidades_lead_venda_id_fkey'
            columns: ['lead_venda_id']
            isOneToOne: false
            referencedRelation: 'leads_venda'
            referencedColumns: ['id']
          },
        ]
      }
      diferenciais: {
        Row: {
          ativo: boolean
          codigo: string
          criado_em: string
          grupo: string
          id: string
          nome: string
          ordem: number
          tipos: string[]
        }
        Insert: {
          ativo?: boolean
          codigo: string
          criado_em?: string
          grupo: string
          id?: string
          nome: string
          ordem?: number
          tipos?: string[]
        }
        Update: {
          ativo?: boolean
          codigo?: string
          criado_em?: string
          grupo?: string
          id?: string
          nome?: string
          ordem?: number
          tipos?: string[]
        }
        Relationships: []
      }
      eventos_funil: {
        Row: {
          criado_em: string
          detalhe: Json | null
          id: string
          rota: string
          sessao_id: string
          tipo_evento: string
        }
        Insert: {
          criado_em?: string
          detalhe?: Json | null
          id?: string
          rota: string
          sessao_id: string
          tipo_evento: string
        }
        Update: {
          criado_em?: string
          detalhe?: Json | null
          id?: string
          rota?: string
          sessao_id?: string
          tipo_evento?: string
        }
        Relationships: []
      }
      interesses_investidor: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          lead_investidor_id: string
          lead_venda_id: string
          mensagem: string | null
          notificado_em: string
          status: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          lead_investidor_id: string
          lead_venda_id: string
          mensagem?: string | null
          notificado_em?: string
          status?: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          lead_investidor_id?: string
          lead_venda_id?: string
          mensagem?: string | null
          notificado_em?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'interesses_investidor_lead_investidor_id_fkey'
            columns: ['lead_investidor_id']
            isOneToOne: false
            referencedRelation: 'leads_investidor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interesses_investidor_lead_venda_id_fkey'
            columns: ['lead_venda_id']
            isOneToOne: false
            referencedRelation: 'leads_venda'
            referencedColumns: ['id']
          },
        ]
      }
      lead_arquivos: {
        Row: {
          criado_em: string
          id: string
          lead_id: string
          mime_type: string | null
          nome_original: string | null
          ordem: number
          rotulo: string | null
          storage_path: string
          tamanho_bytes: number | null
          tipo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          lead_id: string
          mime_type?: string | null
          nome_original?: string | null
          ordem?: number
          rotulo?: string | null
          storage_path: string
          tamanho_bytes?: number | null
          tipo: string
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          lead_id?: string
          mime_type?: string | null
          nome_original?: string | null
          ordem?: number
          rotulo?: string | null
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_arquivos_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads_venda'
            referencedColumns: ['id']
          },
        ]
      }
      leads_investidor: {
        Row: {
          aceita_reforma: boolean | null
          atalhos_regiao: string[] | null
          bairros_preferidos: string | null
          cidades_codigos_ibge: string[] | null
          cidades_interesse: string | null
          criado_em: string | null
          diferenciais: Json | null
          email: string | null
          faixa_valor: string | null
          finalidade: string | null
          forma_pagamento: string | null
          id: string
          min_area_m2: number | null
          min_area_terreno_m2: number | null
          min_quartos: number | null
          min_vagas: number | null
          nome: string | null
          objetivo: string | null
          perfil: string | null
          ponto_referencia: string | null
          prazo_decisao: string | null
          prazo_mudanca: string | null
          preco_maximo: number | null
          preco_minimo: number | null
          preco_teto_absoluto: number | null
          protocolo: string | null
          raio_km: number | null
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
          tipos_imovel: string[] | null
          usa_fgts: boolean | null
          user_id: string | null
          yield_minimo_mensal: number | null
        }
        Insert: {
          aceita_reforma?: boolean | null
          atalhos_regiao?: string[] | null
          bairros_preferidos?: string | null
          cidades_codigos_ibge?: string[] | null
          cidades_interesse?: string | null
          criado_em?: string | null
          diferenciais?: Json | null
          email?: string | null
          faixa_valor?: string | null
          finalidade?: string | null
          forma_pagamento?: string | null
          id?: string
          min_area_m2?: number | null
          min_area_terreno_m2?: number | null
          min_quartos?: number | null
          min_vagas?: number | null
          nome?: string | null
          objetivo?: string | null
          perfil?: string | null
          ponto_referencia?: string | null
          prazo_decisao?: string | null
          prazo_mudanca?: string | null
          preco_maximo?: number | null
          preco_minimo?: number | null
          preco_teto_absoluto?: number | null
          protocolo?: string | null
          raio_km?: number | null
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
          tipos_imovel?: string[] | null
          usa_fgts?: boolean | null
          user_id?: string | null
          yield_minimo_mensal?: number | null
        }
        Update: {
          aceita_reforma?: boolean | null
          atalhos_regiao?: string[] | null
          bairros_preferidos?: string | null
          cidades_codigos_ibge?: string[] | null
          cidades_interesse?: string | null
          criado_em?: string | null
          diferenciais?: Json | null
          email?: string | null
          faixa_valor?: string | null
          finalidade?: string | null
          forma_pagamento?: string | null
          id?: string
          min_area_m2?: number | null
          min_area_terreno_m2?: number | null
          min_quartos?: number | null
          min_vagas?: number | null
          nome?: string | null
          objetivo?: string | null
          perfil?: string | null
          ponto_referencia?: string | null
          prazo_decisao?: string | null
          prazo_mudanca?: string | null
          preco_maximo?: number | null
          preco_minimo?: number | null
          preco_teto_absoluto?: number | null
          protocolo?: string | null
          raio_km?: number | null
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
          tipos_imovel?: string[] | null
          usa_fgts?: boolean | null
          user_id?: string | null
          yield_minimo_mensal?: number | null
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
          diferenciais: Json | null
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
          diferenciais?: Json | null
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
          diferenciais?: Json | null
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
      municipios_sp: {
        Row: {
          codigo_ibge: string
          criado_em: string
          mesorregiao: string | null
          microrregiao: string | null
          nome: string
          nome_normalizado: string
        }
        Insert: {
          codigo_ibge: string
          criado_em?: string
          mesorregiao?: string | null
          microrregiao?: string | null
          nome: string
          nome_normalizado: string
        }
        Update: {
          codigo_ibge?: string
          criado_em?: string
          mesorregiao?: string | null
          microrregiao?: string | null
          nome?: string
          nome_normalizado?: string
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
      regioes_atalho: {
        Row: {
          ativa: boolean
          atualizado_em: string
          cidades: Json
          criado_em: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          cidades?: Json
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          cidades?: Json
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_calcular_compatibilidade: {
        Args: { p_lead_investidor_id: string; p_lead_venda_id: string }
        Returns: {
          criterios_atendidos: Json
          criterios_nao_atendidos: Json
          percentual: number
        }[]
      }
      fn_calcular_compatibilidade_detalhada: {
        Args: { p_lead_investidor_id: string; p_lead_venda_id: string }
        Returns: {
          criterios: Json
          criterios_atendidos: Json
          criterios_nao_atendidos: Json
          percentual: number
        }[]
      }
      fn_compat_extrair_valor_numerico: {
        Args: { p_valor_texto: string }
        Returns: number
      }
      fn_compat_normalizar_texto: { Args: { p_input: string }; Returns: string }
      fn_gestor_atualizar_status_lead: {
        Args: { p_lead_id: string; p_novo_status: string }
        Returns: {
          atualizado_em: string
          id: string
          protocolo: string
          status: string
        }[]
      }
      fn_gestor_decidir_match: {
        Args: { p_acao: string; p_compatibilidade_id: string }
        Returns: {
          atualizado_em: string
          id: string
          status: string
        }[]
      }
      fn_gestor_funil: {
        Args: { p_dias?: number }
        Returns: {
          etapa_id: string
          etapa_nome: string
          etapa_ordem: number
          rota_filtro: string
          sessoes_unicas: number
          total_eventos: number
        }[]
      }
      fn_gestor_listar_leads: {
        Args: never
        Returns: {
          cidade: string
          cidades_interesse: string
          criado_em: string
          email: string
          id: string
          mensagem: string
          motivo_venda: string
          nome: string
          objetivo: string
          perfil: string
          prazo_decisao: string
          prazo_desejado: string
          protocolo: string
          rota: string
          status: string
          telefone: string
          ticket: string
          tipo_imovel: string
          user_id: string
          valor_estimado: string
        }[]
      }
      fn_gestor_listar_matches: {
        Args: never
        Returns: {
          atualizado_em: string
          compatibilidade_id: string
          criado_em: string
          criterios: Json
          criterios_atendidos: Json
          criterios_nao_atendidos: Json
          imovel_cidade: string
          imovel_motivo_venda: string
          imovel_prazo_desejado: string
          imovel_protocolo: string
          imovel_status: string
          imovel_tipo: string
          imovel_valor: string
          interesse_status: string
          investidor_cidades: string
          investidor_email: string
          investidor_nome: string
          investidor_objetivo: string
          investidor_prazo: string
          investidor_protocolo: string
          investidor_telefone: string
          investidor_ticket: string
          ja_tem_interesse: boolean
          lead_investidor_id: string
          lead_venda_id: string
          percentual: number
          proprietario_email: string
          proprietario_nome: string
          proprietario_telefone: string
          status_match: string
        }[]
      }
      fn_is_gestor: { Args: never; Returns: boolean }
      fn_listar_oportunidades_investidor: {
        Args: never
        Returns: {
          cidade: string
          compatibilidade_id: string
          criado_em_imovel: string
          criterios: Json
          criterios_atendidos: Json
          criterios_nao_atendidos: Json
          faixa_valor: string
          interesse_id: string
          interesse_status: string
          ja_manifestou_interesse: boolean
          lead_investidor_id: string
          lead_venda_id: string
          percentual: number
          protocolo_imovel: string
          status_imovel: string
          tese_objetivo: string
          tese_protocolo: string
          tese_ticket: string
          tipo_imovel: string
        }[]
      }
      fn_manifestar_interesse_investidor: {
        Args: {
          p_lead_investidor_id: string
          p_lead_venda_id: string
          p_mensagem?: string
        }
        Returns: {
          id: string
          ja_existia: boolean
          notificado_em: string
          status: string
        }[]
      }
      fn_mascarar_faixa_valor: {
        Args: { p_valor_estimado: string }
        Returns: string
      }
      fn_recalcular_compatibilidade_lead_investidor: {
        Args: { p_lead_investidor_id: string }
        Returns: number
      }
      fn_recalcular_compatibilidade_lead_venda: {
        Args: { p_lead_venda_id: string }
        Returns: number
      }
      fn_recalcular_compatibilidade_par: {
        Args: { p_lead_investidor_id: string; p_lead_venda_id: string }
        Returns: number
      }
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
          p_aceita_reforma?: boolean
          p_atalhos_regiao?: string[]
          p_bairros_preferidos?: string
          p_cidades_codigos_ibge?: string[]
          p_cidades_interesse: string
          p_diferenciais?: Json
          p_email?: string
          p_faixa_valor?: string
          p_finalidade?: string
          p_forma_pagamento?: string
          p_min_area_m2?: number
          p_min_area_terreno_m2?: number
          p_min_quartos?: number
          p_min_vagas?: number
          p_nome?: string
          p_objetivo: string
          p_perfil?: string
          p_ponto_referencia?: string
          p_prazo_decisao: string
          p_prazo_mudanca?: string
          p_preco_maximo?: number
          p_preco_minimo?: number
          p_preco_teto_absoluto?: number
          p_raio_km?: number
          p_rota?: string
          p_telefone: string
          p_ticket: string
          p_tipos_imovel?: string[]
          p_usa_fgts?: boolean
          p_user_id?: string
          p_yield_minimo_mensal?: number
        }
        Returns: {
          id: string
          protocolo: string
        }[]
      }
      fn_submit_lead_simulador_investidor: {
        Args: {
          p_cidade: string
          p_diferenciais?: Json
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
          p_diferenciais?: Json
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
          p_diferenciais?: Json
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
          p_diferenciais?: Json
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
      v_tipo_imovel_norm_ponto_safe: {
        Args: { p_val: number }
        Returns: number
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
