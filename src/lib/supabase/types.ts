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
          bairro_referencia: string | null
          bairros_preferidos: string | null
          cep_referencia: string | null
          cidades_codigos_ibge: string[] | null
          cidades_interesse: string | null
          codigo_ibge_referencia: string | null
          criado_em: string | null
          diferenciais: Json | null
          email: string | null
          faixa_valor: string | null
          finalidade: string | null
          forma_pagamento: string | null
          geocodificado_em: string | null
          id: string
          latitude_referencia: number | null
          localizacao_referencia: unknown
          logradouro_referencia: string | null
          longitude_referencia: number | null
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
          precisao_localizacao: string | null
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
          bairro_referencia?: string | null
          bairros_preferidos?: string | null
          cep_referencia?: string | null
          cidades_codigos_ibge?: string[] | null
          cidades_interesse?: string | null
          codigo_ibge_referencia?: string | null
          criado_em?: string | null
          diferenciais?: Json | null
          email?: string | null
          faixa_valor?: string | null
          finalidade?: string | null
          forma_pagamento?: string | null
          geocodificado_em?: string | null
          id?: string
          latitude_referencia?: number | null
          localizacao_referencia?: unknown
          logradouro_referencia?: string | null
          longitude_referencia?: number | null
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
          precisao_localizacao?: string | null
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
          bairro_referencia?: string | null
          bairros_preferidos?: string | null
          cep_referencia?: string | null
          cidades_codigos_ibge?: string[] | null
          cidades_interesse?: string | null
          codigo_ibge_referencia?: string | null
          criado_em?: string | null
          diferenciais?: Json | null
          email?: string | null
          faixa_valor?: string | null
          finalidade?: string | null
          forma_pagamento?: string | null
          geocodificado_em?: string | null
          id?: string
          latitude_referencia?: number | null
          localizacao_referencia?: unknown
          logradouro_referencia?: string | null
          longitude_referencia?: number | null
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
          precisao_localizacao?: string | null
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
          bairro: string | null
          calc_condominio_mensal: string | null
          calc_custo_acumulado_total: string | null
          calc_custo_mensal_total: string | null
          calc_iptu_anual: string | null
          calc_manutencao_mensal: string | null
          calc_meses_parado: number | null
          calc_taxa_mensal: number | null
          cep: string | null
          cidade: string | null
          codigo_ibge: string | null
          complemento: string | null
          criado_em: string | null
          diferenciais: Json | null
          email: string | null
          geocodificado_em: string | null
          id: string
          latitude: number | null
          localizacao: unknown
          logradouro: string | null
          longitude: number | null
          mensagem: string | null
          motivo_venda: string | null
          nome: string | null
          numero: string | null
          prazo_desejado: string | null
          precisao_localizacao: string | null
          protocolo: string | null
          rota: string
          status: string
          telefone: string
          tipo_imovel: string | null
          user_id: string | null
          valor_estimado: string | null
        }
        Insert: {
          bairro?: string | null
          calc_condominio_mensal?: string | null
          calc_custo_acumulado_total?: string | null
          calc_custo_mensal_total?: string | null
          calc_iptu_anual?: string | null
          calc_manutencao_mensal?: string | null
          calc_meses_parado?: number | null
          calc_taxa_mensal?: number | null
          cep?: string | null
          cidade?: string | null
          codigo_ibge?: string | null
          complemento?: string | null
          criado_em?: string | null
          diferenciais?: Json | null
          email?: string | null
          geocodificado_em?: string | null
          id?: string
          latitude?: number | null
          localizacao?: unknown
          logradouro?: string | null
          longitude?: number | null
          mensagem?: string | null
          motivo_venda?: string | null
          nome?: string | null
          numero?: string | null
          prazo_desejado?: string | null
          precisao_localizacao?: string | null
          protocolo?: string | null
          rota?: string
          status?: string
          telefone: string
          tipo_imovel?: string | null
          user_id?: string | null
          valor_estimado?: string | null
        }
        Update: {
          bairro?: string | null
          calc_condominio_mensal?: string | null
          calc_custo_acumulado_total?: string | null
          calc_custo_mensal_total?: string | null
          calc_iptu_anual?: string | null
          calc_manutencao_mensal?: string | null
          calc_meses_parado?: number | null
          calc_taxa_mensal?: number | null
          cep?: string | null
          cidade?: string | null
          codigo_ibge?: string | null
          complemento?: string | null
          criado_em?: string | null
          diferenciais?: Json | null
          email?: string | null
          geocodificado_em?: string | null
          id?: string
          latitude?: number | null
          localizacao?: unknown
          logradouro?: string | null
          longitude?: number | null
          mensagem?: string | null
          motivo_venda?: string | null
          nome?: string | null
          numero?: string | null
          prazo_desejado?: string | null
          precisao_localizacao?: string | null
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
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ''?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { '': string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      fn_atualizar_coordenadas_lead: {
        Args: {
          p_id: string
          p_latitude: number
          p_longitude: number
          p_precisao?: string
          p_tabela: string
        }
        Returns: boolean
      }
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
          p_bairro_referencia?: string
          p_bairros_preferidos?: string
          p_cep_referencia?: string
          p_cidades_codigos_ibge?: string[]
          p_cidades_interesse: string
          p_codigo_ibge_referencia?: string
          p_diferenciais?: Json
          p_email?: string
          p_faixa_valor?: string
          p_finalidade?: string
          p_forma_pagamento?: string
          p_logradouro_referencia?: string
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
          p_bairro?: string
          p_cep?: string
          p_cidade: string
          p_codigo_ibge?: string
          p_complemento?: string
          p_diferenciais?: Json
          p_email?: string
          p_id?: string
          p_logradouro?: string
          p_mensagem?: string
          p_motivo_venda?: string
          p_nome?: string
          p_numero?: string
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
          p_bairro?: string
          p_cep?: string
          p_cidade: string
          p_codigo_ibge?: string
          p_complemento?: string
          p_diferenciais?: Json
          p_logradouro?: string
          p_numero?: string
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
          p_bairro?: string
          p_cep?: string
          p_cidade?: string
          p_codigo_ibge?: string
          p_complemento?: string
          p_diferenciais?: Json
          p_email: string
          p_id: string
          p_logradouro?: string
          p_mensagem?: string
          p_motivo_venda: string
          p_nome: string
          p_numero?: string
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
      geometry: { Args: { '': string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { '': string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { '': string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { '': string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { '': string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { '': string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { '': string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { '': string }; Returns: string }
      st_astext: { Args: { '': string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { '': string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { '': string }; Returns: unknown }
      st_geographyfromtext: { Args: { '': string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { '': string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { '': string }; Returns: unknown }
      st_geomfromewkt: { Args: { '': string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { '': Json }; Returns: unknown }
        | { Args: { '': Json }; Returns: unknown }
        | { Args: { '': string }; Returns: unknown }
      st_geomfromgml: { Args: { '': string }; Returns: unknown }
      st_geomfromkml: { Args: { '': string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { '': string }; Returns: unknown }
      st_gmltosql: { Args: { '': string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database['public']['CompositeTypes']['valid_detail']
        SetofOptions: {
          from: '*'
          to: 'valid_detail'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { '': string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { '': string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { '': string }; Returns: unknown }
      st_mpointfromtext: { Args: { '': string }; Returns: unknown }
      st_mpolyfromtext: { Args: { '': string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { '': string }; Returns: unknown }
      st_multipointfromtext: { Args: { '': string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { '': string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { '': string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { '': string }; Returns: unknown }
      st_polygonfromtext: { Args: { '': string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { '': string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { '': string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
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
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
