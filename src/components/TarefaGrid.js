// frontend/src/components/TarefaGrid.js
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { FaEdit, FaCheck, FaSpinner, FaUndo, FaTrash } from 'react-icons/fa'; // Mantenha as importações

export default function TarefaGrid({ dados, tipo, onReabrir, onConcluir, onMoverParaAndamento, onRetornarParaAndamento, onExcluirTarefa, carregando, onEditObservationClick, forceUpdate, onFieldClick }) {
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

        // Renderiza o texto - vazio quando não há observações
        const observacaoText = params.value || '';
        const displayText = observacaoText.trim(); // Mostra vazio quando não há observação
        
        return (
            <div style={{
                cursor: 'pointer',
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start', // Alinhamento à esquerda para melhor leitura
                padding: '0 8px', // Adicionar padding
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '14px',
                color: '#000' // Cor preta sempre
            }}
            onClick={handleClick}
            title={observacaoText.trim() === '' ? 'Clique para adicionar observação' : observacaoText}
            >
                {displayText}
            </div>
        );
    }, [onEditObservationClick]);

    // Renderer de célula clicável para aba Concluídas - MOVIDO PARA DENTRO DO COMPONENTE
    const ClickableCellRenderer = useCallback((params) => {
        const handleDoubleClick = (e) => {
            e.stopPropagation();
            if (onFieldClick && params.colDef.field) {
                // Determinar o título do campo baseado no headerName
                const fieldTitle = params.colDef.headerName || params.colDef.field;
                onFieldClick(fieldTitle, params.value || 'Sem informação');
            }
        };

        const cellStyle = {
            cursor: 'pointer',
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: params.colDef.field === 'tarefa' || params.colDef.field === 'descricao' || params.colDef.field === 'observacoes' ? 'flex-start' : 'center',
            padding: '0 8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '14px',
            color: '#000',
            backgroundColor: 'transparent',
            transition: 'background-color 0.2s'
        };

        return (
            <div 
                style={cellStyle}
                onDoubleClick={handleDoubleClick}
                title={`Duplo clique para ver: ${params.value || 'Sem informação'}`}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
                {params.value || ''}
            </div>
        );
    }, [onFieldClick]);

    const comuns = useMemo(() => {
        const baseColumns = [
            { headerName: 'ID', field: 'id_tarefa', flex: 0.5, cellStyle: centerAndNowrap },
            { headerName: 'CRIAÇÃO', field: 'data_criacao', flex: 1, cellStyle: centerAndNowrap },
            { headerName: 'TAREFA', field: 'tarefa', flex: 1, cellStyle: { textAlign: 'left' } },
            { headerName: 'DESCRIÇÃO', field: 'descricao', flex: 1.2, cellStyle: { textAlign: 'left' } },
            { headerName: 'RESPONSÁVEL', field: 'responsavel', flex: 0.9, cellStyle: centerAndNowrap },
            { headerName: 'REPETIR', field: 'repetir', flex: 0.7, cellStyle: centerAndNowrap },
            { headerName: 'PRIORIDADE', field: 'prioridade', flex: 0.9, cellStyle: centerAndNowrap },
            { headerName: 'MÊS', field: 'mes', flex: 0.8, cellStyle: centerAndNowrap },
            { headerName: 'SETOR', field: 'setor', flex: 0.8, cellStyle: centerAndNowrap }
        ];

        // Para aba Concluídas, adicionar cellRenderer clicável
        if (tipo === 'concluidas' && onFieldClick) {
            return baseColumns.map(col => ({
                ...col,
                cellRenderer: ClickableCellRenderer
            }));
        }

        return baseColumns;
    }, [centerAndNowrap, tipo, onFieldClick, ClickableCellRenderer]);

    const columnDefs = useMemo(() => {
        const editarBtn = {
            headerName: '',
            width: 40,
            minWidth: 40,
            maxWidth: 40,
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
            minWidth: 40,
            maxWidth: 40,
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
            width: 40,
            minWidth: 40,
            maxWidth: 40,
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
                        if (onConcluir) onConcluir(params.data.id_tarefa, params.data.observacoes, params.data.repetir);
                    }}
                    title="Concluir tarefa"
                >
                    <FaCheck />
                </button>
            )
        };

        // Botão de excluir para usar nas abas Tarefas e Em Andamento
        const excluirBtn = {
            headerName: '',
            width: 40,
            minWidth: 40,
            maxWidth: 40,
            cellStyle: centerAndNowrap,
            cellRenderer: params => (
                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#dc3545',
                    }}
                    onClick={e => {
                        e.preventDefault();
                        if (onExcluirTarefa) onExcluirTarefa(params.data.id_tarefa);
                    }}
                    title="Excluir tarefa"
                >
                    <FaTrash />
                </button>
            )
        };

        let currentColumns = [...comuns];

        if (tipo === 'tarefas') {
            currentColumns.push(editarBtn, moverBtn, excluirBtn);
        } else if (tipo === 'em_andamento') {
            currentColumns.push(
                {
                    headerName: 'OBSERVAÇÕES',
                    field: 'observacoes',
                    flex: 1.2,
                    cellRenderer: ObservationCellRenderer, // <<< Usando o novo cellRenderer sem cellStyle
                },
                editarBtn,
                concluirBtn,
                excluirBtn
            );
        } else if (tipo === 'concluidas') {
            currentColumns = currentColumns.filter(col => col.field !== 'status_tarefa');
            
            // Adicionar as 3 colunas específicas da aba Concluídas com cellRenderer clicável
            const observacoesColumn = {
                headerName: 'OBSERVAÇÕES',
                field: 'observacoes',
                flex: 1.2,
                cellStyle: { textAlign: 'left' },
                cellRenderer: onFieldClick ? ClickableCellRenderer : undefined
            };
            
            const conclusaoColumn = {
                headerName: 'CONCLUSÃO',
                field: 'data_conclusao',
                flex: 1,
                cellStyle: centerAndNowrap,
                cellRenderer: onFieldClick ? ClickableCellRenderer : undefined
            };
            
            const diasColumn = {
                headerName: 'DIAS',
                field: 'dias_para_conclusao',
                flex: 0.8,
                cellStyle: centerAndNowrap,
                cellRenderer: onFieldClick ? ClickableCellRenderer : undefined
            };
            
            currentColumns.push(observacoesColumn, conclusaoColumn, diasColumn);
            
            // Coluna 13: Ícone de retornar para Em Andamento
            const retornarBtn = {
                headerName: '',
                width: 50,
                minWidth: 50,
                maxWidth: 50,
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
                            if (onRetornarParaAndamento) onRetornarParaAndamento(params.data.id_tarefa);
                        }}
                        title="Retornar para Em Andamento"
                    >
                        <FaUndo />
                    </button>
                )
            };
            
            // Coluna 14: Ícone de excluir tarefa
            const excluirBtn = {
                headerName: '',
                width: 50,
                minWidth: 50,
                maxWidth: 50,
                cellStyle: centerAndNowrap,
                cellRenderer: params => (
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#dc3545',
                        }}
                        onClick={e => {
                            e.preventDefault();
                            if (onExcluirTarefa) onExcluirTarefa(params.data.id_tarefa);
                        }}
                        title="Excluir tarefa"
                    >
                        <FaTrash />
                    </button>
                )
            };
            
            // Adicionar as colunas 13 e 14
            currentColumns.push(retornarBtn, excluirBtn);
        }

        return currentColumns;
    }, [tipo, comuns, onReabrir, onConcluir, onMoverParaAndamento, onRetornarParaAndamento, onExcluirTarefa, centerAndNowrap, ObservationCellRenderer, onFieldClick, ClickableCellRenderer]);

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

    // Forçar atualização da tabela quando os dados mudarem
    useEffect(() => {
        if (gridRef.current && gridRef.current.api && dados) {
            // Força a atualização dos dados na tabela
            gridRef.current.api.setRowData(dados);
            gridRef.current.api.refreshCells();
        }
    }, [dados, forceUpdate]);

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
                backgroundColor: '#c6e0b4',
                minWidth: '1400px'
            }}
        >
            <AgGridReact
                ref={gridRef}
                rowData={dados}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                className="ag-theme-alpine"
                domLayout="autoHeight"
                suppressHorizontalScroll={true}
                suppressVerticalScroll={true}
                headerHeight={40}
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
                enableRangeSelection={false}
                suppressColumnVirtualisation={true}
                maintainColumnOrder={true}
                suppressAutoSize={false}
                sizeColumnsToFit={false}
                stopEditingWhenCellsLoseFocus={true}
                singleClickEdit={false}
                suppressClickEdit={true}
            />
        </div>
    );
}