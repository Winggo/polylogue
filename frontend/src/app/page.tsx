'use client';

import React, { useMemo, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    ReactFlowProvider,
    addEdge,
    useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';

import LLMNode, { NodeProps } from "../components/LlmNode";
import ViewportInfo from "../components/ViewportInfo";


const nodeTypes = {
    llmText: (props: NodeProps) => {
        return <LLMNode {...props} />
    },
};


export default function Flow() {
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const nodes = useMemo(() => [
        {
            id: '1',
            position: { x: 10, y: 10 },
            type: 'llmText',
            data: {},
        },
        {
            id: '2',
            position: { x: 600, y: 100 },
            type: 'llmText',
            data: {},
        },
    ], []);

      const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [],
      );

    return (
        <ReactFlowProvider>
            <div className="h-screen w-screen bg-gray-100">
                <ReactFlow
                    onConnect={onConnect}
                    onEdgesChange={onEdgesChange}
                    defaultNodes={nodes}
                    defaultEdges={edges}
                    preventScrolling={false}
                    nodeTypes={nodeTypes}
                >
                    <Background gap={25} />
                    <Controls position="top-right" showInteractive={false} />
                    <ViewportInfo />
                </ReactFlow>
            </div>
        </ReactFlowProvider>
    );
};
