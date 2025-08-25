// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Container, Tabs, Tab, Modal, Row, Col, Alert } from 'react-bootstrap';
import { Button, Card, Input, Title, Form, FormGroup } from './styles';
import { TabbedOverlay, useTabbedOverlay } from './styles/components/overlays';
import TarefaGrid from './components/TarefaGrid';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
// Certifique-se de que seu arquivo CSS principal está importado aqui, ex:
// import './App.css'; // Ou index.css, dependendo da sua estrutura

const MESES = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL',
    'MAIO', 'JUNHO', 'JULHO', 'AGOSTO',
    'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        console.warn("Data de criação inválida detectada:", value);
        return '';
    }
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Removido formatMonth já que não está sendo usado

// Configuração do Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Certifique-se de que REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY estão definidas');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
    const [tarefas, setTarefas] = useState([]);
    const [emAndamento, setEmAndamento] = useState([]);
    const [concluidas, setConcluidas] = useState([]);
    const [activeTab, setActiveTab] = useState('mural');
    const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
    const [carregando, setCarregando] = useState(true);
    const [mensagem, setMensagem] = useState(null);
    const [tipoMsg, setTipoMsg] = useState('success');
    const [showModal, setShowModal] = useState(false);
    const [novaTarefa, setNovaTarefa] = useState({
        tarefa: '', descricao: '', responsavel: 'JEAN',
        repetir: 'NÃO', prioridade: 'NORMAL', setor: ''
    });
    const [editId, setEditId] = useState(null);
    const [forceUpdate, setForceUpdate] = useState(0); // Para forçar atualização da tabela

    // ESTADOS PARA O MODAL DE DESCRIÇÃO
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [currentDescription, setCurrentDescription] = useState('');
    const [currentObservations, setCurrentObservations] = useState('');

    // NOVOS ESTADOS PARA O MODAL DE EDIÇÃO DE OBSERVAÇÕES
    const [showEditObsModal, setShowEditObsModal] = useState(false);
    const [editingObsId, setEditingObsId] = useState(null);
    const [editingObsText, setEditingObsText] = useState('');

    const [mesRelatorio, setMesRelatorio] = useState(new Date().getMonth());
    const [relatorio, setRelatorio] = useState({});
    const totaisRelatorio = useMemo(() => {
        const dados = relatorio[mesRelatorio] || {};
        return Object.values(dados).reduce((acc, setor) => ({
            solicitadas: acc.solicitadas + (setor.solicitadas || 0),
            andamento: acc.andamento + (setor.andamento || 0),
            concluidas: acc.concluidas + (setor.concluidas || 0),
            naoIniciadas: acc.naoIniciadas + (setor.naoIniciadas || 0)
        }), { solicitadas: 0, andamento: 0, concluidas: 0, naoIniciadas: 0 });
    }, [relatorio, mesRelatorio]);

    const dadosSolicitadas = useMemo(() =>
      Object.entries(relatorio[mesRelatorio] || {})
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([setor, valores]) => ({ setor, solicitadas: valores.solicitadas }))
    , [relatorio, mesRelatorio]);

    const isFormValid = useMemo(() => {
        const { tarefa, responsavel, repetir, prioridade, setor } = novaTarefa;
        return Boolean(tarefa && responsavel && repetir && prioridade && setor);
    }, [novaTarefa]);

    useEffect(() => {
        carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function carregarDados() {
        setCarregando(true);
        try {
            // Carregar tarefas A REALIZAR
            const { data: tarefasData, error: tarefasError } = await supabase
                .from('tarefas')
                .select('*')
                .eq('status', 'A REALIZAR')
                .order('id_tarefa');

            if (tarefasError) throw tarefasError;

            // Carregar tarefas EM ANDAMENTO com observações
            const { data: andamentoData, error: andamentoError } = await supabase
                .from('tarefas')
                .select(`
                    *,
                    em_andamento!left(observacoes)
                `)
                .eq('status', 'EM ANDAMENTO')
                .order('id_tarefa');

            if (andamentoError) throw andamentoError;

            // Carregar tarefas CONCLUÍDAS
            const { data: concluidasData, error: concluidasError } = await supabase
                .from('tarefas')
                .select(`
                    *,
                    concluidas!left(observacoes, data_conclusao, dias_para_conclusao)
                `)
                .eq('status', 'CONCLUIDA')
                .order('id_tarefa');

            if (concluidasError) throw concluidasError;

            const formatar = arr => {
                if (!arr) return [];
                return arr.map(x => ({
                    ...x,
                    data_criacao: formatDate(x.data_criacao),
                    data_criacao_para_ordenacao: x.data_criacao,
                    mes: MESES[new Date(x.data_criacao).getMonth()].substring(0, 3).toUpperCase(),
                    observacoes: x.concluidas?.observacoes || x.em_andamento?.observacoes || '',
                    data_conclusao: x.concluidas?.data_conclusao ? formatDate(x.concluidas?.data_conclusao) : '',
                    dias_para_conclusao: x.concluidas?.dias_para_conclusao || 0
                }));
            };

            setTarefas(formatar(tarefasData));
            setEmAndamento(formatar(andamentoData));
            setConcluidas(formatar(concluidasData));

            const { data: todasTarefas, error: relatorioError } = await supabase
                .from('tarefas')
                .select('status, setor, data_criacao');

            if (relatorioError) throw relatorioError;

            const agrupados = todasTarefas.reduce((acc, t) => {
                const mes = new Date(t.data_criacao).getMonth();
                const setor = t.setor || 'SEM SETOR';
                acc[mes] ??= {};
                acc[mes][setor] ??= { solicitadas: 0, andamento: 0, concluidas: 0, naoIniciadas: 0 };

                acc[mes][setor].solicitadas++;
                if (t.status === 'CONCLUIDA') acc[mes][setor].concluidas++;
                else if (t.status === 'EM ANDAMENTO') acc[mes][setor].andamento++;
                else acc[mes][setor].naoIniciadas++;

                return acc;
            }, {});
            setRelatorio(agrupados);

        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            mostrarMsg('Erro ao carregar dados: ' + e.message, 'danger');
        } finally {
            setCarregando(false);
        }
    }

    function mostrarMsg(txt, tipo = 'success') {
        setMensagem(txt);
        setTipoMsg(tipo);
        setTimeout(() => setMensagem(null), 2000);
    }

    async function salvarTarefa() {
        try {
            console.log("Salvando tarefa com dados:", novaTarefa);
            
            if (editId) {
                // UPDATE
                const { error } = await supabase
                    .from('tarefas')
                    .update({
                        tarefa: novaTarefa.tarefa,
                        descricao: novaTarefa.descricao,
                        responsavel: novaTarefa.responsavel,
                        repetir: novaTarefa.repetir,
                        prioridade: novaTarefa.prioridade,
                        mes: novaTarefa.mes,
                        setor: novaTarefa.setor
                    })
                    .eq('id_tarefa', editId);

                if (error) throw error;
            } else {
                // INSERT
                const { error } = await supabase
                    .from('tarefas')
                    .insert({
                        data_criacao: new Date().toISOString(),
                        tarefa: novaTarefa.tarefa,
                        descricao: novaTarefa.descricao,
                        status: 'A REALIZAR',
                        responsavel: novaTarefa.responsavel,
                        repetir: novaTarefa.repetir,
                        prioridade: novaTarefa.prioridade,
                        mes: MESES[new Date().getMonth()].substring(0, 3).toUpperCase(),
                        setor: novaTarefa.setor
                    });

                if (error) throw error;
            }

            mostrarMsg(editId ? 'Tarefa atualizada!' : 'Tarefa criada!');
            setShowModal(false);
            setEditId(null);
            carregarDados();
        } catch (e) {
            console.error(e);
            mostrarMsg('Erro ao salvar tarefa: ' + e.message, 'danger');
        }
    }

    async function moverParaAndamento(id) {
        try {
            // Atualizar status da tarefa
            const { error: updateError } = await supabase
                .from('tarefas')
                .update({ status: 'EM ANDAMENTO' })
                .eq('id_tarefa', id);

            if (updateError) throw updateError;

            // Inserir na tabela em_andamento
            const { error: insertError } = await supabase
                .from('em_andamento')
                .upsert({ id_tarefa: id }, { onConflict: 'id_tarefa' });

            if (insertError) throw insertError;

            mostrarMsg('Tarefa movida para Em Andamento.');
            carregarDados();
        } catch (e) {
            console.error(e);
            mostrarMsg('Erro ao mover: ' + e.message, 'danger');
        }
    }

    async function concluir(id, obs = '') {
        try {
            // Buscar a tarefa para verificar se deve repetir
            const { data: tarefaData, error: selectError } = await supabase
                .from('tarefas')
                .select('*')
                .eq('id_tarefa', id)
                .single();

            if (selectError) throw selectError;

            // Buscar observações da tabela em_andamento
            const { data: andamentoData, error: andamentoError } = await supabase
                .from('em_andamento')
                .select('observacoes')
                .eq('id_tarefa', id)
                .single();

            console.log('🔍 Debug - andamentoData:', andamentoData);
            console.log('🔍 Debug - andamentoError:', andamentoError);
            console.log('🔍 Debug - obs parameter:', obs);

            const observacoes = andamentoData?.observacoes || obs || '';
            console.log('🔍 Debug - observacoes final:', observacoes);

            // Calcular dias para conclusão
            const dataCriacao = new Date(tarefaData.data_criacao);
            const dataAtual = new Date();
            const diasParaConclusao = Math.floor((dataAtual - dataCriacao) / (1000 * 60 * 60 * 24));

            // Atualizar status da tarefa
            const { error: updateError } = await supabase
                .from('tarefas')
                .update({ status: 'CONCLUIDA' })
                .eq('id_tarefa', id);

            if (updateError) throw updateError;

            // Inserir na tabela concluidas
            const dadosParaInserir = {
                id_tarefa: id,
                observacoes: observacoes,
                data_conclusao: new Date().toISOString(),
                dias_para_conclusao: diasParaConclusao
            };
            console.log('🔍 Debug - dadosParaInserir:', dadosParaInserir);

            const { error: insertError } = await supabase
                .from('concluidas')
                .upsert(dadosParaInserir, { onConflict: 'id_tarefa' });

            console.log('🔍 Debug - insertError:', insertError);
            if (insertError) throw insertError;

            // Remover da tabela em_andamento
            const { error: deleteError } = await supabase
                .from('em_andamento')
                .delete()
                .eq('id_tarefa', id);

            if (deleteError) throw deleteError;

            mostrarMsg(`Tarefa ${id} concluída!`);

            // --- CÓDIGO CORRIGIDO ---
            // Verificar se a tarefa deve ser repetida
            if (tarefaData.repetir === 'SIM') {
                console.log("Tarefa é repetível. Criando nova instância...");
                
                // 1. Use a data de criação original retornada pelo Supabase
                const dataCriacaoOriginal = new Date(tarefaData.data_criacao);

                // 2. Crie a nova data de criação para a tarefa repetida
                const novaDataCriacao = new Date(dataCriacaoOriginal);
                novaDataCriacao.setMonth(novaDataCriacao.getMonth() + 1);

                // 3. Calcule o 'mes' com base na nova data para garantir consistência
                const proximoMesNome = MESES[novaDataCriacao.getMonth()].substring(0, 3).toUpperCase();
                
                const { error: repeatError } = await supabase
                    .from('tarefas')
                    .insert({
                        // 4. Use a NOVA data de criação
                        data_criacao: novaDataCriacao.toISOString(),
                        tarefa: tarefaData.tarefa,
                        descricao: tarefaData.descricao,
                        status: 'A REALIZAR',
                        responsavel: tarefaData.responsavel,
                        repetir: tarefaData.repetir,
                        prioridade: tarefaData.prioridade,
                        mes: proximoMesNome,
                        setor: tarefaData.setor
                    });

                if (repeatError) {
                    console.error('Erro ao criar tarefa repetível:', repeatError);
                    mostrarMsg('Erro ao criar nova tarefa repetível.', 'warning');
                } else {
                    mostrarMsg('Nova tarefa repetível criada automaticamente!', 'info');
                }
            }

            carregarDados();
        } catch (e) {
            console.error('Erro ao concluir tarefa:', e);
            mostrarMsg('Erro ao concluir tarefa: ' + e.message, 'danger');
        }
    }

    const handleSaveObservation = async () => {
        if (!editingObsId) {
            mostrarMsg('Erro: ID da tarefa não encontrado para salvar observação.', 'danger');
            return;
        }

        try {
            setCarregando(true);
            console.log(`Salvando observação para tarefa ${editingObsId} (Texto: ${editingObsText})`);
            
            const { error } = await supabase
                .from('em_andamento')
                .upsert({
                    id_tarefa: parseInt(editingObsId),
                    observacoes: editingObsText
                }, { onConflict: 'id_tarefa' });

            if (error) throw error;

            // Atualizar diretamente o estado em memória IMEDIATAMENTE
            setEmAndamento(prevAndamento => 
                prevAndamento.map(tarefa => 
                    tarefa.id_tarefa === parseInt(editingObsId) 
                        ? { ...tarefa, observacoes: editingObsText }
                        : tarefa
                )
            );

            // Forçar re-render da tabela
            setForceUpdate(prev => prev + 1);

            mostrarMsg('Observação salva com sucesso!', 'success');
            handleCloseEditObsModal();
            
            // CORREÇÃO: Carregar dados atualizados de forma mais robusta
            setTimeout(async () => {
                try {
                    // Carregar dados específicos da tarefa editada para garantir sincronização
                    const { data: tarefaAtualizada, error: errorTarefa } = await supabase
                        .from('tarefas')
                        .select(`
                            *,
                            em_andamento!left(observacoes)
                        `)
                        .eq('status', 'EM ANDAMENTO')
                        .eq('id_tarefa', parseInt(editingObsId))
                        .single();

                    if (!errorTarefa && tarefaAtualizada) {
                        const tarefaFormatada = {
                            ...tarefaAtualizada,
                            data_criacao: formatDate(tarefaAtualizada.data_criacao),
                            data_criacao_para_ordenacao: tarefaAtualizada.data_criacao,
                            mes: MESES[new Date(tarefaAtualizada.data_criacao).getMonth()].substring(0, 3).toUpperCase(),
                            observacoes: tarefaAtualizada.em_andamento?.observacoes || ''
                        };

                        // Atualizar apenas a tarefa específica no estado
                        setEmAndamento(prevAndamento => 
                            prevAndamento.map(tarefa => 
                                tarefa.id_tarefa === parseInt(editingObsId) 
                                    ? tarefaFormatada
                                    : tarefa
                            )
                        );

                        // Forçar mais uma atualização
                        setForceUpdate(prev => prev + 1);
                        
                        console.log('✅ Dados sincronizados com sucesso!');
                    }
                } catch (syncError) {
                    console.error('Erro na sincronização:', syncError);
                    // Fallback: recarregar todos os dados
                    carregarDados();
                }
            }, 200);
            
        } catch (error) {
            console.error('Erro ao salvar observação:', error);
            mostrarMsg(`Erro ao salvar observação: ${error.message}`, 'danger');
        } finally {
            setCarregando(false);
        }
    };

    async function retornarParaAndamento(id) {
        try {
            // Buscar dados da tarefa concluída
            const { data: tarefaConcluida, error: selectError } = await supabase
                .from('concluidas')
                .select('*')
                .eq('id_tarefa', id)
                .single();

            if (selectError) throw selectError;

            // Atualizar status da tarefa para EM ANDAMENTO
            const { error: updateError } = await supabase
                .from('tarefas')
                .update({ status: 'EM ANDAMENTO' })
                .eq('id_tarefa', id);

            if (updateError) throw updateError;

            // Inserir na tabela em_andamento com as observações
            const { error: insertError } = await supabase
                .from('em_andamento')
                .upsert({
                    id_tarefa: id,
                    observacoes: tarefaConcluida.observacoes || ''
                }, { onConflict: 'id_tarefa' });

            if (insertError) throw insertError;

            // Remover da tabela concluidas
            const { error: deleteError } = await supabase
                .from('concluidas')
                .delete()
                .eq('id_tarefa', id);

            if (deleteError) throw deleteError;

            mostrarMsg(`Tarefa ${id} retornada para Em Andamento!`);
            carregarDados();
        } catch (e) {
            console.error('Erro ao retornar tarefa:', e);
            mostrarMsg('Erro ao retornar tarefa: ' + e.message, 'danger');
        }
    }

    async function excluirTarefa(id) {
        if (!window.confirm('Tem certeza que deseja excluir esta tarefa permanentemente?')) {
            return;
        }

        try {
            // Remover da tabela em_andamento
            const { error: deleteEmAndamento } = await supabase
                .from('em_andamento')
                .delete()
                .eq('id_tarefa', id);

            if (deleteEmAndamento) throw deleteEmAndamento;

            // Remover da tabela concluidas
            const { error: deleteConcluidas } = await supabase
                .from('concluidas')
                .delete()
                .eq('id_tarefa', id);

            if (deleteConcluidas) throw deleteConcluidas;

            // Remover da tabela tarefas
            const { error: deleteTarefas } = await supabase
                .from('tarefas')
                .delete()
                .eq('id_tarefa', id);

            if (deleteTarefas) throw deleteTarefas;

            mostrarMsg(`Tarefa ${id} excluída permanentemente!`);
            carregarDados();
        } catch (e) {
            console.error('Erro ao excluir tarefa:', e);
            mostrarMsg('Erro ao excluir tarefa: ' + e.message, 'danger');
        }
    }

    const handleEditObservationClick = (id, currentObs) => {
        setEditingObsId(id);
        setEditingObsText(currentObs || '');
        setShowEditObsModal(true);
    };

    const handleCloseEditObsModal = () => {
        setShowEditObsModal(false);
        setEditingObsId(null);
        setEditingObsText('');
    };

    function reabrir(id) {
        let taskToEdit = tarefas.find(x => x.id_tarefa === id);
        if (!taskToEdit) {
            taskToEdit = emAndamento.find(x => x.id_tarefa === id);
        }
        if (!taskToEdit) {
            taskToEdit = concluidas.find(x => x.id_tarefa === id);
        }

        if (!taskToEdit) {
            console.warn("Tarefa não encontrada para reabrir/editar (ID: " + id + ").");
            return;
        }

        console.log("Tarefa carregada para edição:", taskToEdit);
        setEditId(id);
        setNovaTarefa({
            tarefa: taskToEdit.tarefa,
            descricao: taskToEdit.descricao,
            responsavel: taskToEdit.responsavel,
            repetir: taskToEdit.repetir,
            prioridade: taskToEdit.prioridade,
            setor: taskToEdit.setor,
            observacoes: taskToEdit.observacoes || ''
        });
        setShowModal(true);
    }

    const mesAtualNomeCurto = MESES[mesSelecionado].substring(0, 3).toUpperCase();

    const getPrioridadeValor = (prioridade) => {
        switch (prioridade && prioridade.toUpperCase()) {
            case 'ALTA': return 3;
            case 'NORMAL': return 2;
            case 'BAIXA': return 1;
            default: return 0;
        }
    };

    const getCardClasses = (tarefa) => {
        let classes = 'card-postit';
        const responsavel = tarefa.responsavel ? tarefa.responsavel.toLowerCase() : '';

        if (responsavel === 'jean' || responsavel === 'ivana') {
            classes += ` ${responsavel}`;
        }

        if (tarefa.prioridade) {
            classes += ` prioridade-${tarefa.prioridade.toUpperCase()}`;
        } else {
            classes += ` prioridade-NORMAL`;
        }
        return classes;
    };

    // Função para dividir as tarefas por responsável nas colunas específicas com ordenação por prioridade
    const distribuirEmColunasPorResponsavel = (arr, numColunas = 4) => {
        const colunas = Array.from({ length: numColunas }, () => []);
        
        // Função para ordenar por prioridade: ALTA -> NORMAL -> BAIXA
        const ordenarPorPrioridade = (tarefas) => {
            return tarefas.sort((a, b) => {
                const prioridadeA = getPrioridadeValor(a.prioridade);
                const prioridadeB = getPrioridadeValor(b.prioridade);
                return prioridadeB - prioridadeA; // Ordem decrescente (ALTA primeiro)
            });
        };
        
        // Separar tarefas por responsável (só tarefas válidas)
        const tarefasJean = arr.filter(tarefa => 
            tarefa && tarefa.responsavel && tarefa.responsavel.toLowerCase() === 'jean' && 
            tarefa.tarefa && tarefa.tarefa.trim() !== ''
        );
        const tarefasIvana = arr.filter(tarefa => 
            tarefa && tarefa.responsavel && tarefa.responsavel.toLowerCase() === 'ivana' && 
            tarefa.tarefa && tarefa.tarefa.trim() !== ''
        );
        
        // Ordenar por prioridade
        const tarefasJeanOrdenadas = ordenarPorPrioridade(tarefasJean);
        const tarefasIvanaOrdenadas = ordenarPorPrioridade(tarefasIvana);
        
        // Distribuir tarefas do Jean nas colunas 1 e 2 (índices 0 e 1)
        tarefasJeanOrdenadas.forEach((tarefa, idx) => {
            const colunaIndex = idx % 2; // Alterna entre coluna 0 e 1
            colunas[colunaIndex].push(tarefa);
        });
        
        // Distribuir tarefas da Ivana nas colunas 3 e 4 (índices 2 e 3)
        tarefasIvanaOrdenadas.forEach((tarefa, idx) => {
            const colunaIndex = 2 + (idx % 2); // Alterna entre coluna 2 e 3
            colunas[colunaIndex].push(tarefa);
        });
        
        return colunas;
    };

    // Filtrar tarefas pelo mês selecionado e status correto
    const tarefasARealizarDoMes = tarefas.filter(t => 
        t && t.status === 'A REALIZAR' && t.mes === mesAtualNomeCurto && t.tarefa && t.tarefa.trim() !== ''
    );
    const andamentoDoMes = emAndamento.filter(t => 
        t && t.mes === mesAtualNomeCurto && t.tarefa && t.tarefa.trim() !== ''
    );
    const tarefasColunas = distribuirEmColunasPorResponsavel(tarefasARealizarDoMes);
    const andamentoColunas = distribuirEmColunasPorResponsavel(andamentoDoMes);

    const handleOpenDescriptionModal = (event, tarefa) => {
        event.stopPropagation();

        setCurrentDescription(tarefa.descricao || 'Sem descrição.');
        setCurrentObservations(tarefa.observacoes || '');
        setShowDescriptionModal(true);
        console.log("Modal de descrição SET para visível pelo clique no ícone.");
    };

    const handleDescriptionModalClose = (event) => {
        if (event.target.id === 'task-description-modal-overlay') {
            setShowDescriptionModal(false);
            setCurrentDescription('');
            setCurrentObservations('');
        }
    };

    const SetorTick = ({ x, y, payload }) => (
        <text x={x} y={y} fill="var(--text-primary)" textAnchor="middle" dominantBaseline="middle">
            {payload.value}
        </text>
    );

    return (
        <Container fluid className="mt-3 d-flex flex-column" style={{ minHeight: '100vh' }}>
            {mensagem && (
                <Alert
                    variant={tipoMsg}
                    onClose={() => setMensagem(null)}
                    dismissible
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 1050,
                        minWidth: '250px',
                        maxWidth: '350px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        borderRadius: '5px',
                        padding: '1rem',
                        textAlign: 'center'
                    }}
                >
                    {mensagem}
                </Alert>
            )}

            <div className="header-content-container">
                <div className="header-logo-title">
                    <img 
                        src="/synnova-logo.svg" 
                        alt="SynNova Logo" 
                        className="logo-synnova"
                    />
                    <h2 className="text-center text-primary">Sistema de Controle de Tarefas</h2>
                </div>

                {(activeTab === 'mural' || activeTab === 'relatorios') && (
                    <div className="meses-grid-container">
                        {MESES.map((nome, idx) => {
                            const isActive =
                                activeTab === 'mural'
                                    ? mesSelecionado === idx
                                    : mesRelatorio === idx;

                            const handleClick = () => {
                                if (activeTab === 'mural') {
                                    setMesSelecionado(idx);
                                } else {
                                    setMesRelatorio(idx);
                                }
                            };

                            return (
                                <Button
                                    key={idx}
                                    size="sm"
                                    className={isActive ? 'active' : ''}
                                    onClick={handleClick}
                                >
                                    {nome.substring(0, 3).toUpperCase()}
                                </Button>
                            );
                        })}
                    </div>
                )}




            </div>

            <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-2 tabs-container" style={{ position: 'relative' }}>
                    <Tabs activeKey={activeTab} onSelect={setActiveTab}>
                        <Tab eventKey="mural" title="Mural"></Tab>
                        <Tab eventKey="tarefas" title="Tarefas"></Tab>
                        <Tab eventKey="em_andamento" title="Em Andamento"></Tab>
                        <Tab eventKey="concluidas" title="Concluídas"></Tab>
                        <Tab eventKey="relatorios" title="Relatórios" />
                    </Tabs>
                    {activeTab === 'tarefas' && (
                        <Button
                            className="btn-criar-nova-tarefa-azul"
                            style={{ 
                                position: 'absolute',
                                right: '0px',
                                top: '50%',
                                transform: 'translateY(-50%)'
                            }}
                            onClick={() => {
                                setEditId(null);
                                setNovaTarefa({
                                    tarefa: '', descricao: '', responsavel: 'JEAN', repetir: 'NÃO', prioridade: 'NORMAL', setor: ''
                                });
                                setShowModal(true);
                            }}
                        >
                            Criar Nova Tarefa
                        </Button>
                    )}
                </div>

                {activeTab === 'mural' && (
                    <div className="mural-container">
                        <div className="mural-section">
                            <h5 className="mural-title">TAREFAS A REALIZAR</h5>
                            <div className="cards-grid-4col-container">
                                {tarefasColunas.map((col, colIdx) => (
                                    <div key={`tarefas-col-${colIdx}`} className="mural-4col-column">
                                        {col.filter(tarefa => tarefa && tarefa.tarefa && tarefa.tarefa.trim() !== '').map(tarefa => (
                                            <div
                                                key={`tarefa-${tarefa.id_tarefa}`}
                                                className={getCardClasses(tarefa)}
                                                data-description={tarefa.descricao || 'Sem descrição.'}
                                                data-observations={tarefa.observacoes || ''}
                                            >
                                                <span
                                                    className="card-open-modal-icon"
                                                    onClick={(e) => handleOpenDescriptionModal(e, tarefa)}
                                                    title="Ver detalhes"
                                                >
                                                    +
                                                </span>
                                                {tarefa.tarefa}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mural-section">
                            <h5 className="mural-title">TAREFAS EM ANDAMENTO</h5>
                            <div className="cards-grid-4col-container">
                                {andamentoColunas.map((col, colIdx) => (
                                    <div key={`andamento-col-${colIdx}`} className="mural-4col-column">
                                        {col.filter(tarefa => tarefa && tarefa.tarefa && tarefa.tarefa.trim() !== '').map(tarefa => (
                                            <div
                                                key={`andamento-${tarefa.id_tarefa}`}
                                                className={getCardClasses(tarefa)}
                                                data-description={tarefa.descricao || 'Sem descrição.'}
                                                data-observations={tarefa.observacoes || ''}
                                            >
                                                <span
                                                    className="card-open-modal-icon"
                                                    onClick={(e) => handleOpenDescriptionModal(e, tarefa)}
                                                    title="Ver detalhes"
                                                >
                                                    +
                                                </span>
                                                {tarefa.tarefa}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tarefas' && (
                    <div style={{ height: '14.8cm', width: '100%' }} className="ag-theme-alpine">
                        <TarefaGrid
                            dados={tarefas}
                            tipo="tarefas"
                            onReabrir={reabrir}
                            onMoverParaAndamento={moverParaAndamento}
                            carregando={carregando}
                        />
                    </div>
                )}

                {activeTab === 'em_andamento' && (
                    <div style={{ height: '14.8cm', width: '100%' }} className="ag-theme-alpine">
                        <TarefaGrid
                            dados={emAndamento}
                            tipo="em_andamento"
                            onConcluir={concluir}
                            onReabrir={reabrir}
                            carregando={carregando}
                            onEditObservationClick={handleEditObservationClick}
                            forceUpdate={forceUpdate}
                        />
                    </div>
                )}

                {activeTab === 'concluidas' && (
                    <div style={{ height: '14.8cm', width: '100%' }} className="ag-theme-alpine">
                        <TarefaGrid 
                            dados={concluidas} 
                            tipo="concluidas" 
                            onRetornarParaAndamento={retornarParaAndamento}
                            onExcluirTarefa={excluirTarefa}
                            carregando={carregando} 
                        />
                    </div>
                )}

                    {activeTab === 'relatorios' && (
                    <div className="relatorios-container">
                        <Card>
                            <div className="relatorio-grid">
                                <div className="relatorio-header">
                                    <span>Setor</span>
                                    <span>Solicitadas</span>
                                    <span>Em Andamento</span>
                                    <span>Concluídas</span>
                                    <span>Não Iniciadas</span>
                                </div>
                                {Object.entries(relatorio[mesRelatorio] || {}).sort(([a],[b]) => a.localeCompare(b)).map(([setor, dados]) => (
                                    <div key={setor} className="relatorio-row">
                                        <span>{setor}</span>
                                        <span>{dados.solicitadas}</span>
                                        <span>{dados.andamento}</span>
                                        <span>{dados.concluidas}</span>
                                        <span>{dados.naoIniciadas}</span>
                                    </div>
                                ))}
                                <div className="relatorio-row relatorio-total-row">
                                    <span>Total</span>
                                    <span>{totaisRelatorio.solicitadas}</span>
                                    <span>{totaisRelatorio.andamento}</span>
                                    <span>{totaisRelatorio.concluidas}</span>
                                    <span>{totaisRelatorio.naoIniciadas}</span>
                                </div>
                            </div>
                        </Card>
                        <div className="relatorio-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dadosSolicitadas} margin={{ left: 0 }}>
                                    <XAxis
                                        dataKey="setor"
                                        tick={<SetorTick />}
                                        interval={0}
                                    />
                                    <YAxis width={0} tick={false} axisLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="solicitadas" fill="var(--tab-inactive-bg)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal ORIGINAL (para Criar/Editar Tarefa) */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{editId ? 'Editar' : 'Nova'} Tarefa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <FormGroup className="mb-2">
                            <label>Tarefa *</label>
                            <Input
                                name="tarefa"
                                value={novaTarefa.tarefa}
                                onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup className="mb-2">
                            <label>Descrição</label>
                            <Input
                                name="descricao"
                                value={novaTarefa.descricao}
                                onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                            />
                        </FormGroup>
                        <Row>
                            <Col>
                                <FormGroup className="mb-2">
                                    <label>Responsável *</label>
                                    <Input
                                        as="select"
                                        name="responsavel"
                                        value={novaTarefa.responsavel}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                    >
                                        <option>JEAN</option>
                                        <option>IVANA</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col>
                                <FormGroup className="mb-2">
                                    <label>Repetir *</label>
                                    <Input
                                        as="select"
                                        name="repetir"
                                        value={novaTarefa.repetir}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                    >
                                        <option>SIM</option>
                                        <option>NÃO</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <FormGroup className="mb-2">
                                    <label>Prioridade *</label>
                                    <Input
                                        as="select"
                                        name="prioridade"
                                        value={novaTarefa.prioridade}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                    >
                                        <option>BAIXA</option>
                                        <option>NORMAL</option>
                                        <option>ALTA</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col>
                                <FormGroup className="mb-2">
                                    <label>Setor *</label>
                                    <Input
                                        name="setor"
                                        value={novaTarefa.setor}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={salvarTarefa} disabled={!isFormValid}>Salvar</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Descrição da Tarefa (apenas para exibição) */}
            {showDescriptionModal && (
                <div id="task-description-modal-overlay" className="modal-overlay" onClick={handleDescriptionModalClose}>
                    <div id="task-description-modal-content" className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <span className="close-button" onClick={() => setShowDescriptionModal(false)}>&times;</span>

                        {currentDescription && (
                            <>
                                <h5>Descrição:</h5>
                                <p id="modal-description-text" className="modal-text-content">{currentDescription}</p>
                            </>
                        )}

                        {currentObservations && (
                            <>
                                <div className="modal-separator"></div>
                                <h5>Observações:</h5>
                                <p id="modal-observations-text" className="modal-text-content">{currentObservations}</p>
                            </>
                        )}

                        {!currentDescription && !currentObservations && (
                            <p className="text-muted">Nenhuma descrição ou observação disponível para esta tarefa.</p>
                        )}
                    </div>
                </div>
            )}

            {/* NOVO MODAL PARA EDIÇÃO DE OBSERVAÇÕES */}
            <Modal show={showEditObsModal} onHide={handleCloseEditObsModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Observação da Tarefa #{editingObsId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FormGroup className="mb-3">
                        <label>Observações</label>
                        <Input
                            as="textarea"
                            rows={5}
                            value={editingObsText}
                            onChange={(e) => setEditingObsText(e.target.value)}
                            placeholder="Digite suas observações aqui..."
                        />
                    </FormGroup>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseEditObsModal}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSaveObservation}>
                        Salvar Observação
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}