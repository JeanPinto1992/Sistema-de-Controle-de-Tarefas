// src/App.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    Container, Tabs, Tab, Button,
    Modal, Form, Row, Col, Alert
} from 'react-bootstrap';
import TarefaGrid from './components/TarefaGrid';
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

function formatMonth(value) {
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        console.warn("Data de criação inválida detectada para mês:", value);
    }
    return MESES[d.getMonth()].substring(0, 3).toUpperCase();
}

const API_BASE_URL = ''; // Servidor unificado - mesmo domínio e porta

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
        repetir: 'NÃO', prioridade: 'NORMAL', setor: '', observacoes: ''
    });
    const [editId, setEditId] = useState(null);

    // ESTADOS PARA O MODAL DE DESCRIÇÃO
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [currentDescription, setCurrentDescription] = useState('');
    const [currentTaskTitle, setCurrentTaskTitle] = useState(''); // Mantido para referência, mas não renderizado
    const [currentObservations, setCurrentObservations] = useState('');

    // NOVOS ESTADOS PARA O MODAL DE EDIÇÃO DE OBSERVAÇÕES
    const [showEditObsModal, setShowEditObsModal] = useState(false);
    const [editingObsId, setEditingObsId] = useState(null);
    const [editingObsText, setEditingObsText] = useState('');

    const isFormValid = useMemo(() => {
        const { tarefa, responsavel, repetir, prioridade, setor } = novaTarefa;
        return Boolean(tarefa && responsavel && repetir && prioridade && setor);
    }, [novaTarefa]);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setCarregando(true);
        try {
            const [tRes, aRes, cRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/tarefas`),
                axios.get(`${API_BASE_URL}/api/em-andamento`),
                axios.get(`${API_BASE_URL}/api/concluidas`)
            ]);

            const formatar = arr => arr.map(x => ({
                ...x,
                data_criacao: formatDate(x.data_criacao),
                data_criacao_para_ordenacao: x.data_criacao,
                mes: MESES[new Date(x.data_criacao).getMonth()].substring(0, 3).toUpperCase()
            }));

            setTarefas(formatar(tRes.data));
            setEmAndamento(formatar(aRes.data));
            setConcluidas(formatar(cRes.data.map(x => ({
                ...x,
                data_conclusao: formatDate(x.data_conclusao)
            }))));
        } catch (e) {
            console.error(e);
            mostrarMsg('Erro ao carregar dados.', 'danger');
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
            await axios.post(`${API_BASE_URL}/api/tarefas`, {
                ...novaTarefa,
                id_tarefa_para_atualizar: editId
            });
            mostrarMsg(editId ? 'Tarefa atualizada!' : 'Tarefa criada!');
            setShowModal(false);
            setEditId(null);
            carregarDados();
        } catch (e) {
            console.error(e);
            mostrarMsg('Erro ao salvar tarefa.', 'danger');
        }
    }

    async function moverParaAndamento(id) {
        try {
            await axios.post(`${API_BASE_URL}/api/tarefas/mover-para-andamento`, { id_tarefa: id });
            mostrarMsg('Tarefa movida para Em Andamento.');
            carregarDados();
        } catch (e) {
            console.error(e);
            mostrarMsg('Erro ao mover.', 'danger');
        }
    }

    async function concluir(id, obs = '') {
        try {
            // 1. Marcar a tarefa como concluída no backend
            await axios.post(`${API_BASE_URL}/api/tarefas/mover-para-concluidas`, { id_tarefa: id, observacoes: obs });
            mostrarMsg(`Tarefa ${id} concluída!`);

            // 2. Encontrar a tarefa que foi concluída localmente
            const tarefaConcluida = emAndamento.find(t => t.id_tarefa === id);

            // 3. Verificar se a tarefa concluída deve ser repetida
            if (tarefaConcluida && tarefaConcluida.repetir === 'SIM') {
                console.log("Tarefa é repetível. Criando nova instância...");
                const novaTarefaParaRepetir = {
                    ...tarefaConcluida,
                    id_tarefa: undefined, // Remova o ID existente para que o banco de dados gere um novo
                    data_criacao: new Date().toISOString(), // Nova data de criação (hoje)
                    completed: false, // Garante que a nova tarefa não esteja concluída
                    observacoes: '' // Opcional: Limpar observações da nova tarefa
                };

                // 4. Enviar a nova tarefa para o backend como uma nova criação
                try {
                    await axios.post(`${API_BASE_URL}/api/tarefas`, novaTarefaParaRepetir);
                    mostrarMsg('Nova tarefa repetível criada automaticamente!', 'info');
                } catch (e) {
                    console.error('Erro ao criar tarefa repetível:', e);
                    mostrarMsg('Erro ao criar nova tarefa repetível.', 'warning');
                }
            }

            // 5. Recarregar todos os dados para refletir as alterações
            carregarDados();
        } catch (e) {
            console.error('Erro ao concluir tarefa:', e);
            mostrarMsg('Erro ao concluir tarefa.', 'danger');
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
            const response = await axios.put(`${API_BASE_URL}/api/em-andamento/${editingObsId}/observacoes`, {
                observacoes: editingObsText,
            });

            if (response.status === 200) {
                mostrarMsg('Observação salva com sucesso!', 'success');
                carregarDados();
                handleCloseEditObsModal();
            } else {
                mostrarMsg('Erro inesperado ao salvar observação. Status: ' + response.status, 'danger');
                console.error('Resposta inesperada do backend:', response.data);
            }
        } catch (error) {
            console.error('Erro ao salvar observação:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Verifique o console para mais detalhes.';
            mostrarMsg(`Erro ao salvar observação: ${errorMessage}`, 'danger');
        } finally {
            setCarregando(false);
        }
    };

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

    const { tarefasAgrupadasJean, tarefasAgrupadasIvana,
        andamentoAgrupadasJean, andamentoAgrupadasIvana } = useMemo(() => {
            const groupAndSortByResponsible = (data) => {
                const filtered = data.filter(t => t.mes === mesAtualNomeCurto);

                const grouped = {
                    jean: [],
                    ivana: []
                };

                filtered.forEach(tarefa => {
                    const responsavel = tarefa.responsavel ? tarefa.responsavel.toLowerCase() : '';
                    if (responsavel === 'jean') {
                        grouped.jean.push(tarefa);
                    } else if (responsavel === 'ivana') {
                        grouped.ivana.push(tarefa);
                    }
                });

                const sortGroup = (arr) => arr.sort((a, b) => {
                    const prioridadeA = getPrioridadeValor(a.prioridade);
                    const prioridadeB = getPrioridadeValor(b.prioridade);

                    if (prioridadeB !== prioridadeA) {
                        return prioridadeB - prioridadeA;
                    }

                    const dataA = new Date(a.data_criacao_para_ordenacao);
                    const dataB = new Date(b.data_criacao_para_ordenacao);

                    if (isNaN(dataA.getTime()) && isNaN(dataB.getTime())) return 0;
                    if (isNaN(dataA.getTime())) return 1;
                    if (isNaN(dataB.getTime())) return -1;

                    return dataA.getTime() - dataB.getTime();
                });

                return {
                    jean: sortGroup(grouped.jean),
                    ivana: sortGroup(grouped.ivana)
                };
            };

            const groupedTarefas = groupAndSortByResponsible(tarefas);
            const groupedAndamento = groupAndSortByResponsible(emAndamento);

            return {
                tarefasAgrupadasJean: groupedTarefas.jean,
                tarefasAgrupadasIvana: groupedTarefas.ivana,
                andamentoAgrupadasJean: groupedAndamento.jean,
                andamentoAgrupadasIvana: groupedAndamento.ivana
            };
        }, [tarefas, emAndamento, mesAtualNomeCurto]);

    const handleOpenDescriptionModal = (event, tarefa) => {
        event.stopPropagation();

        setCurrentDescription(tarefa.descricao || 'Sem descrição.');
        setCurrentObservations(tarefa.observacoes || '');
        setCurrentTaskTitle(tarefa.tarefa);
        setShowDescriptionModal(true);
        console.log("Modal de descrição SET para visível pelo clique no ícone.");
    };

    useEffect(() => {
        // A lógica de listeners para cards inteiros (como dblclick) foi removida ou simplificada.
        // Agora, o modal é acionado pelo clique direto no ícone '+'.
        // O `currentTaskTitle` e `currentObservations` são setados no `handleOpenDescriptionModal`.
    }, [activeTab]);


    const handleDescriptionModalClose = (event) => {
        if (event.target.id === 'task-description-modal-overlay') {
            setShowDescriptionModal(false);
            setCurrentDescription('');
            setCurrentTaskTitle('');
            setCurrentObservations('');
        }
    };


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
                <h2 className="text-center text-primary">Sistema de Controle de Tarefas</h2>

                {activeTab === 'mural' && (
                    <div className="meses-grid-container">
                        {MESES.map((nome, idx) => (
                            <Button
                                key={idx}
                                size="sm"
                                className={mesSelecionado === idx ? 'active' : ''}
                                onClick={() => setMesSelecionado(idx)}
                            >
                                {nome.substring(0, 3).toUpperCase()}
                            </Button>
                        ))}
                    </div>
                )}

                {activeTab === 'tarefas' && (
                    <div className="btn-criar-tarefa-container">
                        <Button
                            onClick={() => {
                                setEditId(null);
                                setNovaTarefa({
                                    tarefa: '', descricao: '', responsavel: 'JEAN', repetir: 'NÃO', prioridade: 'NORMAL', setor: '', observacoes: ''
                                });
                                setShowModal(true);
                            }}
                        >
                            Criar Nova Tarefa
                        </Button>
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-2 tabs-container">
                    <Tabs activeKey={activeTab} onSelect={setActiveTab} className="flex-grow-1">
                        <Tab eventKey="mural" title="Mural"></Tab>
                        <Tab eventKey="tarefas" title="Tarefas"></Tab>
                        <Tab eventKey="em_andamento" title="Em Andamento"></Tab>
                        <Tab eventKey="concluidas" title="Concluídas"></Tab>
                    </Tabs>
                </div>
            </div>

            <div className="flex-grow-1">
                {activeTab === 'mural' && (
                    <>
                        <div className="mural-container">
                            <div className="mural-section">
                                <h5 className="mural-title">TAREFAS A REALIZAR</h5>
                                <div className="cards-grid-container">
                                    <div className="jean-column-container">
                                        {tarefasAgrupadasJean.map(tarefa => (
                                            <div
                                                key={tarefa.id_tarefa}
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
                                    <div className="ivana-column-container">
                                        {tarefasAgrupadasIvana.map(tarefa => (
                                            <div
                                                key={tarefa.id_tarefa}
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
                                </div>
                            </div>

                            <div className="mural-section">
                                <h5 className="mural-title">TAREFAS EM ANDAMENTO</h5>
                                <div className="cards-grid-container">
                                    <div className="jean-column-container">
                                        {andamentoAgrupadasJean.map(tarefa => (
                                            <div
                                                key={tarefa.id_tarefa}
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
                                    <div className="ivana-column-container">
                                        {andamentoAgrupadasIvana.map(tarefa => (
                                            <div
                                                key={tarefa.id_tarefa}
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
                                </div>
                            </div>
                        </div>
                    </>
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
                        />
                    </div>
                )}

                {activeTab === 'concluidas' && (
                    <div style={{ height: '14.8cm', width: '100%' }} className="ag-theme-alpine">
                        <TarefaGrid dados={concluidas} tipo="concluidas" carregando={carregando} />
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
                        <Form.Group className="mb-2">
                            <Form.Label>Tarefa *</Form.Label>
                            <Form.Control
                                name="tarefa"
                                value={novaTarefa.tarefa}
                                onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control
                                name="descricao"
                                value={novaTarefa.descricao}
                                onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                            />
                        </Form.Group>
                        {activeTab !== 'concluidas' && (
                            <Form.Group className="mb-2">
                                <Form.Label>Observações</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="observacoes"
                                    value={novaTarefa.observacoes || ''}
                                    onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                />
                            </Form.Group>
                        )}
                        <Row>
                            <Col>
                                <Form.Group className="mb-2">
                                    <Form.Label>Responsável *</Form.Label>
                                    <Form.Select
                                        name="responsavel"
                                        value={novaTarefa.responsavel}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                    >
                                        <option>JEAN</option>
                                        <option>IVANA</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-2">
                                    <Form.Label>Repetir *</Form.Label>
                                    <Form.Select
                                        name="repetir"
                                        value={novaTarefa.repetir}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                    >
                                        <option>SIM</option>
                                        <option>NÃO</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Form.Group className="mb-2">
                                    <Form.Label>Prioridade *</Form.Label>
                                    <Form.Select
                                        name="prioridade"
                                        value={novaTarefa.prioridade}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                    >
                                        <option>BAIXA</option>
                                        <option>NORMAL</option>
                                        <option>ALTA</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-2">
                                    <Form.Label>Setor *</Form.Label>
                                    <Form.Control
                                        name="setor"
                                        value={novaTarefa.setor}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, [e.target.name]: e.target.value })}
                                    />
                                </Form.Group>
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
                    <Form.Group className="mb-3">
                        <Form.Label>Observações</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={5}
                            value={editingObsText}
                            onChange={(e) => setEditingObsText(e.target.value)}
                            placeholder="Digite suas observações aqui..."
                        />
                    </Form.Group>
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