import React, { useState, useEffect } from 'react'
import {
  RegiaoAtalho,
  MunicipioSP,
  listarRegioesAtalho,
  listarMunicipiosSP,
  gestorSalvarRegiaoAtalho,
  gestorExcluirRegiaoAtalho,
} from '@/services/regioes'
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  MapPin,
  RefreshCw,
} from 'lucide-react'

export const GestorRegioesTab: React.FC = () => {
  const [atalhos, setAtalhos] = useState<RegiaoAtalho[]>([])
  const [municipios, setMunicipios] = useState<MunicipioSP[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sucessoMsg, setSucessoMsg] = useState('')

  // Modal de edição / criação
  const [modalAberto, setModalAberto] = useState(false)
  const [idEdicao, setIdEdicao] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ordem, setOrdem] = useState(1)
  const [ativa, setAtiva] = useState(true)
  const [cidadesSelecionadas, setCidadesSelecionadas] = useState<
    { codigo: string; nome: string }[]
  >([])
  const [buscaCidade, setBuscaCidade] = useState('')

  const carregarDados = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [listaAtalhos, listaMunicipios] = await Promise.all([
        listarRegioesAtalho(false),
        listarMunicipiosSP(),
      ])
      setAtalhos(listaAtalhos)
      setMunicipios(listaMunicipios)
    } catch (err: any) {
      setErrorMsg('Falha ao carregar atalhos de região: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const abrirCriacao = () => {
    setIdEdicao(null)
    setNome('')
    setDescricao('')
    setOrdem(atalhos.length + 1)
    setAtiva(true)
    setCidadesSelecionadas([])
    setBuscaCidade('')
    setErrorMsg('')
    setSucessoMsg('')
    setModalAberto(true)
  }

  const abrirEdicao = (item: RegiaoAtalho) => {
    setIdEdicao(item.id)
    setNome(item.nome)
    setDescricao(item.descricao || '')
    setOrdem(item.ordem)
    setAtiva(item.ativa)
    setCidadesSelecionadas(item.cidades || [])
    setBuscaCidade('')
    setErrorMsg('')
    setSucessoMsg('')
    setModalAberto(true)
  }

  const toggleCidadeNoAtalho = (m: MunicipioSP) => {
    setCidadesSelecionadas((prev) => {
      const existe = prev.some((c) => c.codigo === m.codigo_ibge)
      if (existe) {
        return prev.filter((c) => c.codigo !== m.codigo_ibge)
      } else {
        return [...prev, { codigo: m.codigo_ibge, nome: m.nome }]
      }
    })
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErrorMsg('Informe o nome da região.')
      return
    }
    if (cidadesSelecionadas.length === 0) {
      setErrorMsg('Selecione pelo menos uma cidade para este atalho regional.')
      return
    }

    setSalvando(true)
    setErrorMsg('')
    setSucessoMsg('')

    const res = await gestorSalvarRegiaoAtalho({
      id: idEdicao || undefined,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      ordem,
      ativa,
      cidades: cidadesSelecionadas,
    })

    setSalvando(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao salvar atalho.')
      return
    }

    setSucessoMsg('Atalho regional salvo com sucesso!')
    setModalAberto(false)
    await carregarDados()
  }

  const handleExcluir = async (id: string, nomeAtalho: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o atalho "${nomeAtalho}"?`)) {
      return
    }

    setLoading(true)
    const res = await gestorExcluirRegiaoAtalho(id)
    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao excluir atalho.')
    } else {
      setSucessoMsg(`Atalho "${nomeAtalho}" excluído com sucesso.`)
      await carregarDados()
    }
    setLoading(false)
  }

  // Filtragem de municípios no modal
  const municipiosFiltrados = municipios
    .filter((m) => {
      if (!buscaCidade.trim()) return true
      const t = buscaCidade.toLowerCase().trim()
      return m.nome.toLowerCase().includes(t) || m.codigo_ibge.includes(t)
    })
    .slice(0, 30)

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#081226] border border-[#1A3A75]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#22C7E0]" />
            <span>Atalhos de Região (Busca do Comprador/Investidor)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie os atalhos regionais exibidos na busca do comprador para marcação rápida de
            cidades em lote.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={carregarDados}
            disabled={loading}
            className="p-2 rounded-lg bg-[#070B14] border border-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={abrirCriacao}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#22C7E0] hover:bg-[#1fb3c9] text-[#070B14] font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Atalho</span>
          </button>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-3 text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lista de Atalhos Regionais */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#22C7E0] mx-auto" />
          <p className="text-xs">Carregando atalhos regionais...</p>
        </div>
      ) : atalhos.length === 0 ? (
        <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-xl bg-[#081226]">
          Nenhum atalho regional cadastrado no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {atalhos.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                item.ativa
                  ? 'bg-[#081226] border-[#1A3A75]'
                  : 'bg-[#081226]/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#22C7E0] tracking-wider block">
                      Ordem {item.ordem} • {item.ativa ? 'Ativo' : 'Inativo'}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{item.nome}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(item)}
                      className="p-1.5 rounded-md bg-[#070B14] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluir(item.id, item.nome)}
                      className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.descricao && (
                  <p className="text-xs text-slate-400 leading-snug">{item.descricao}</p>
                )}

                {/* Chips com as cidades incluídas */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-slate-300 font-semibold block">
                    Cidades vinculadas ({item.cidades.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {item.cidades.map((c) => (
                      <span
                        key={c.codigo}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#070B14] border border-slate-800 text-slate-300"
                      >
                        <MapPin className="w-2.5 h-2.5 text-[#22C7E0]" />
                        <span>{c.nome}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#081226] border border-[#1A3A75] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#22C7E0]" />
                <span>{idEdicao ? 'Editar Atalho Regional' : 'Novo Atalho Regional'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-3.5 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    Nome da Região *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Campinas e região"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-sm text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={ordem}
                    onChange={(e) => setOrdem(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Descrição Curta
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Cidades do polo tecnológico e região metropolitana"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070B14] border border-slate-700 focus:border-[#22C7E0] text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-ativa"
                  checked={ativa}
                  onChange={(e) => setAtiva(e.target.checked)}
                  className="w-4 h-4 accent-[#22C7E0] cursor-pointer"
                />
                <label
                  htmlFor="chk-ativa"
                  className="text-xs text-slate-300 font-medium cursor-pointer"
                >
                  Atalho ativo e visível na busca do comprador
                </label>
              </div>

              {/* Seletor de Cidades vinculadas ao atalho */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    Cidades do Atalho ({cidadesSelecionadas.length} selecionadas) *
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar cidade..."
                    value={buscaCidade}
                    onChange={(e) => setBuscaCidade(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded bg-[#070B14] border border-slate-700 text-white outline-none"
                  />
                </div>

                {/* Lista de Cidades */}
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#070B14] border border-slate-800 max-h-48 overflow-y-auto">
                  {municipiosFiltrados.map((m) => {
                    const isSelected = cidadesSelecionadas.some((c) => c.codigo === m.codigo_ibge)
                    return (
                      <button
                        type="button"
                        key={m.codigo_ibge}
                        onClick={() => toggleCidadeNoAtalho(m)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-[#1A3A75] border-[#22C7E0] text-white'
                            : 'bg-[#081226] border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-[#22C7E0] border-[#22C7E0] text-[#070B14]'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                        <span>{m.nome}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#22C7E0] hover:bg-[#1fb3c9] text-[#070B14] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Atalho</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
