// frontend/src/components/TarefaGrid.js
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { FaEdit, FaCheck, FaSpinner, FaUndo, FaTrash } from 'react-icons/fa';

export default function TarefaGrid({ dados, tipo, onReabrir, onConcluir, onMoverParaAndamento, onRetornarParaAndamento, onExcluirTarefa, carregando, onEditObservationClick, forceUpdate, onFieldClick }) {
    const gridRef = useRef();
    
    // Estado para armazenar as larguras originais das colunas
    const [originalWidths, setOriginalWidths] = useState({});
    const [autoSizedColumns, setAutoSizedColumns] = useState(new Set());

    // Estilo de célula centralizado e com quebra de linha
    const centerAndNowrap = useCallback(() => ({
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }), []);

    // Renderer de célula para Observações que permite clicar para editar
    const ObservationCellRenderer = useCallback((params) => {
        const handleClick = (e) => {
            e.stopPropagation();
            if (onEditObservationClick && params.data && params.data.id_tarefa) {
                onEditObservationClick(params.data.id_tarefa, params.value);
            }
        };

        const observacaoText = params.value || '';
        const displayText = observacaoText.trim();
        
        return (
            <div style={{
                cursor: 'pointer',
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '0 8px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '14px',
                color: '#000'
            }}
            onClick={handleClick}
            title={observacaoText.trim() === '' ? 'Clique para adicionar observação' : observacaoText}
            >
                {displayText}
            </div>
        );
    }, [onEditObservationClick]);

    // Renderer de célula clicável para aba Concluídas
    const ClickableCellRenderer = useCallback((params) => {
        const handleDoubleClick = (e) => {
            e.stopPropagation();
            if (onFieldClick && params.colDef.field) {
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

    // Handler para duplo clique no separador das colunas
    const onColumnResized = useCallback((params) => {
        if (params.source === 'uiColumnResized' && params.finished) {
            const columnId = params.column.getColId();
            
            // Armazenar largura original se ainda não foi armazenada
            if (!originalWidths[columnId]) {
                setOriginalWidths(prev => ({
                    ...prev,
                    [columnId]: params.column.getColDef().flex || params.column.getColDef().width || 100
                }));
            }
        }
    }, [originalWidths]);

    // Handler para duplo clique no header (separador)
    const onHeaderDoubleClick = useCallback((event) => {
        const columnId = event.column.getColId();
        const gridApi = gridRef.current?.api;
        
        if (!gridApi) return;

        // Verificar se a coluna já foi auto-ajustada
        if (autoSizedColumns.has(columnId)) {
            // Voltar à largura original
            const originalWidth = originalWidths[columnId];
            if (originalWidth) {
                if (typeof originalWidth === 'number' && originalWidth < 10) {
                    // É um valor flex
                    gridApi.setColumnWidths([{ key: columnId, newWidth: null }]);
                    const colDef = event.column.getColDef();
                    colDef.flex = originalWidth;
                    delete colDef.width;
                } else {
                    // É uma largura fixa
                    gridApi.setColumnWidths([{ key: columnId, newWidth: originalWidth }]);
                }
                
                setAutoSizedColumns(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(columnId);
                    return newSet;
                });
            }
        } else {
            // Armazenar largura original se ainda não foi armazenada
            if (!originalWidths[columnId]) {
                const colDef = event.column.getColDef();
                const originalWidth = colDef.flex || colDef.width || 100;
                setOriginalWidths(prev => ({
                    ...prev,
                    [columnId]: originalWidth
                }));
            }
            
            // Auto-ajustar a coluna
            gridApi.autoSizeColumn(columnId);
            
            setAutoSizedColumns(prev => new Set([...prev, columnId]));
        }
    }, [originalWidths, autoSizedColumns]);

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
                    cellRenderer: ObservationCellRenderer,
                },
                editarBtn,
                concluirBtn,
                excluirBtn
            );
        } else if (tipo === 'concluidas') {
            currentColumns = currentColumns.filter(col => col.field !== 'status_tarefa');
            
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
            
            const excluirBtnConcluidas = {
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
            
            currentColumns.push(retornarBtn, excluirBtnConcluidas);
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

    useEffect(() => {
        if (gridRef.current && gridRef.current.api && dados) {
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
                onColumnResized={onColumnResized}
                onHeaderDoubleClick={onHeaderDoubleClick}
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