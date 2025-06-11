// frontend/src/components/TarefaGrid.js
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { FaEdit, FaCheck, FaSpinner } from 'react-icons/fa'; // Mantenha as importações

export default function TarefaGrid({ dados, tipo, onReabrir, onConcluir, onMoverParaAndamento, carregando, onEditObservationClick }) {
    const gridRef = useRef();

    // Estilo de célula centralizado e com quebra de linha
    const centerAndNowrap = useCallback(() => ({
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }), []); // Sem dependências, pois não usa props/state

    // Renderer de célula para Observações que permite clicar para editar
    const ObservationCellRenderer = useCallback((params) => {
        const handleClick = (e) => {
            e.stopPropagation(); // É importante manter isso para que o clique não ative outras coisas no Ag-Grid.
            if (onEditObservationClick && params.data && params.data.id_tarefa) {
                // Passa o ID da tarefa e o valor atual da observação
                onEditObservationClick(params.data.id_tarefa, params.value);
            }
        };

        // Renderiza o texto e adiciona um evento de clique
        return (
            <div style={{
                cursor: 'pointer', // Adiciona um cursor de "ponteiro" para indicar que é clicável
                height: '100%',
                width: '100%', // Ocupa toda a largura da célula
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}
            onClick={handleClick}
            title={params.value || 'Clique para adicionar/editar observação'} // Dica ao passar o mouse
            >
                {params.value || ''} {/* Exibe o valor ou vazio */}
            </div>
        );
    }, [onEditObservationClick]);


    const comuns = useMemo(() => [
        { headerName: 'ID', field: 'id_tarefa', flex: 0.5, cellStyle: centerAndNowrap },
        { headerName: 'CRIAÇÃO', field: 'data_criacao', flex: 1, cellStyle: centerAndNowrap },
        { headerName: 'TAREFA', field: 'tarefa', flex: 1, cellStyle: { textAlign: 'left' } },
        { headerName: 'DESCRIÇÃO', field: 'descricao', flex: 1.2, cellStyle: { textAlign: 'left' } },
        { headerName: 'STATUS', field: 'status_tarefa', flex: 0.7, cellStyle: centerAndNowrap },
        { headerName: 'RESPONSÁVEL', field: 'responsavel', flex: 0.9, cellStyle: centerAndNowrap },
        { headerName: 'REPETIR', field: 'repetir', flex: 0.7, cellStyle: centerAndNowrap },
        { headerName: 'PRIORIDADE', field: 'prioridade', flex: 0.9, cellStyle: centerAndNowrap },
        { headerName: 'MÊS', field: 'mes', flex: 0.8, cellStyle: centerAndNowrap },
        { headerName: 'SETOR', field: 'setor', flex: 0.8, cellStyle: centerAndNowrap }
    ], [centerAndNowrap]); 

    const columnDefs = useMemo(() => {
        const editarBtn = {
            headerName: '',
            width: 40,
            cellStyle: centerAndNowrap,
            cellRenderer: params => (
                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#0d6efd',
                    }}
                    onClick={e => {
                        e.preventDefault();
                        if (onReabrir) {
                            onReabrir(params.data.id_tarefa);
                        }
                    }}
                    title="Editar tarefa"
                >
                    <FaEdit />
                </button>
            )
        };

        const moverBtn = {
            headerName: '',
            width: 40,
            cellStyle: centerAndNowrap,
            cellRenderer: params => (
                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ff9900',
                    }}
                    onClick={e => {
                        e.preventDefault();
                        if (onMoverParaAndamento) onMoverParaAndamento(params.data.id_tarefa);
                    }}
                    title="Mover para Em Andamento"
                >
                    <FaSpinner />
                </button>
            )
        };

        const concluirBtn = {
            headerName: '',
            flex: 0.6,
            cellStyle: centerAndNowrap,
            cellRenderer: params => (
                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#198754',
                    }}
                    onClick={e => {
                        e.preventDefault();
                        // >>> ALTERAÇÃO CRUCIAL AQUI: PASSA params.data.repetir PARA onConcluir <<<
                        if (onConcluir) onConcluir(params.data.id_tarefa, params.data.observacoes, params.data.repetir);
                    }}
                    title="Concluir tarefa"
                >
                    <FaCheck />
                </button>
            )
        };

        let currentColumns = [...comuns];

        if (tipo === 'tarefas') {
            currentColumns.push(editarBtn, moverBtn);
        } else if (tipo === 'em_andamento') {
            currentColumns.push(
                {
                    headerName: 'OBSERVAÇÕES',
                    field: 'observacoes',
                    flex: 1.2,
                    cellStyle: centerAndNowrap,
                    cellRenderer: ObservationCellRenderer, // <<< Usando o novo cellRenderer
                },
                editarBtn,
                concluirBtn
            );
        } else if (tipo === 'concluidas') {
            currentColumns = currentColumns.filter(col => col.field !== 'status_tarefa');
            currentColumns.push(
                { headerName: 'OBSERVAÇÕES', field: 'observacoes', flex: 1.2, cellStyle: centerAndNowrap },
                { headerName: 'CONCLUSÃO', field: 'data_conclusao', flex: 1, cellStyle: centerAndNowrap },
                { headerName: 'DIAS', field: 'dias_para_conclusao', flex: 0.8, cellStyle: centerAndNowrap }
            );
        }

        return currentColumns;
    }, [tipo, comuns, onReabrir, onConcluir, onMoverParaAndamento, centerAndNowrap, ObservationCellRenderer]);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        suppressMovable: true,
        wrapText: false,
        filter: true,
    }), []);

    const getRowId = useCallback((params) => {
        return params.data.id_tarefa;
    }, []);

    const onGridReady = useCallback((params) => {
        if (carregando) {
            params.api.showLoadingOverlay();
        } else {
            params.api.hideOverlay();
        }
    }, [carregando]);

    useEffect(() => {
        if (gridRef.current && gridRef.current.api) {
            if (carregando) {
                gridRef.current.api.showLoadingOverlay();
            } else {
                gridRef.current.api.hideOverlay();
            }
        }
    }, [carregando]);

    const customLoadingOverlay = useMemo(() => {
        return (
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; background-color: rgba(255, 255, 255, 0.2);">
                <div class="spinner-border text-primary" role="status" style="width: 2rem; height: 2rem;">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <div class="ms-2 text-primary">Atualizando...</div>
            </div>`
        );
    }, []);

    return (
        <div
            className="ag-theme-alpine"
            style={{
                width: '100%',
                height: 'auto',
                maxHeight: '14.8cm', // Mantenha a altura da sua tabela como estava
                backgroundColor: '#c6e0b4',
            }}
        >
            <AgGridReact
                ref={gridRef}
                rowData={dados}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowHeight={40}
                animateRows={true}
                getRowId={getRowId}
                onGridReady={onGridReady}
                overlayNoRowsTemplate={
                    `<div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; background-color: #c6e0b4;">
                        <span style="color: #4a673c; font-size: 1.1em;">Nenhum dado para mostrar</span>
                    </div>`
                }
                overlayLoadingTemplate={customLoadingOverlay}
                domLayout='autoHeight'
            />
        </div>
    );
}