'use client'

import React, { useCallback, useRef, useEffect, useState } from 'react'
import {
    ReactFlow,
    Background,
    addEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
    MarkerType,
    Connection,
    Node,
    Edge,
} from '@xyflow/react'
import { Fade } from "react-awesome-reveal"

import LLMNode from "../LLMNode/LlmNode"
import CanvasInfo from "./CanvasInfo"
import {
    llmNodeSize,
    edgeStrokeColor,
    edgeStyles,
} from "../../utils/constants"


let id = 1
const getId = () => `${id++}`
const nodeTypes = {
    llmText: LLMNode,
}

type ExtendedNode = {
    id: string,
    type: string,
    position: {
        x: number,
        y: number,
    },
    data: {
        model?: string,
        prompt?: string,
        prompt_response?: string,
        parent_ids?: Array<string>,
    },
    selected?: boolean,
}

type FlowProps = {
    canvasId: string,
    existingNodes?: ExtendedNode[],
    newCanvas?: boolean,
}


function createEdge(sourceId: string, targetId: string) {
    return {
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: edgeStrokeColor,
        },
    }
}


export default function Flow({ canvasId, existingNodes, newCanvas }: FlowProps) {
    const reactFlowInstance = useReactFlow()
    const reactFlowWrapper = useRef<HTMLDivElement | null>(null)
    const [flowRendered, setFlowRendered] = useState(false)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

    // Existing nodes present, create edges for them
    useEffect(() => {
        if (existingNodes) {
            const edgesForExistingNodes: Edge[] = []
            for (const exNode of existingNodes) {
                if (exNode.data.parent_ids && exNode.data.parent_ids.length > 0) {
                    for (const parentId of exNode.data.parent_ids) {
                        edgesForExistingNodes.push(
                            createEdge(parentId, exNode.id)
                        )
                    }   
                }
            }
            setNodes((nds) => nds.concat(existingNodes || []))
            setEdges((eds) => eds.concat(edgesForExistingNodes))
        }
    }, [existingNodes])

    // Upon new canvas, create single node in center of canvas
    useEffect(() => {
        if (!newCanvas) return
        if (!reactFlowWrapper?.current) return
        const { width, height } = reactFlowWrapper.current.getBoundingClientRect()
        const position = {
            x: ((width / 2) - (llmNodeSize.width / 2)) * (1 / 0.9), // account for 0.9 zoom
            y: ((height / 2) - (llmNodeSize.height / 2)) * (1 / 0.9),
        };

        const newNode = {
            id: '0',
            position,
            type: 'llmText',
            data: {},
            selected: true,
        }

        reactFlowInstance.addNodes(newNode)
    }, [reactFlowInstance, newCanvas])

    // Create new node on Cmd/Ctrl + '
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setCursorPosition({ x: event.clientX, y: event.clientY })
        }
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === '\'') {
                event.preventDefault()
                const newNode: Node = {
                    id: getId(),
                    position: { x: cursorPosition.x, y: cursorPosition.y },
                    type: 'llmText',
                    data: {},
                    selected: true,
                }
                setNodes((nds) => {
                    return nds.map((n) => {
                        return { ...n, selected: false }
                    }).concat({ ...newNode, selected: true }) 
                })
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [setNodes, cursorPosition])

    const onConnect = useCallback(
        (connection: Connection) => setEdges(
            (eds) => {
                const newEdge: Edge = createEdge(connection.source, connection.target)
                return addEdge(newEdge, eds)
            }
        ),
        [setEdges],
    )

    const onConnectEnd = useCallback(
        (
            event: MouseEvent | TouchEvent,
            connectionState: { isValid: boolean | null; fromNode: Node | null }
        ) => {
            if (!connectionState.isValid) {
                const id = getId()
                const { clientX, clientY } =
                    'changedTouches' in event ? event.changedTouches[0] : event
                const newNode: Node = {
                    id,
                    position: reactFlowInstance.screenToFlowPosition({
                        x: clientX,
                        y: clientY,
                    }),
                    type: 'llmText',
                    data: {},
                    origin: [0.0, 0.5],
                    selected: true,
                }
                setNodes((nds) => nds.concat(newNode))

                if (connectionState.fromNode !== null) {
                    const newEdge: Edge = createEdge(connectionState.fromNode.id, id)
                    setEdges((eds) => [...eds, newEdge])
                }
            }
        },
        [reactFlowInstance, setEdges, setNodes],
    )

    return (
        <Fade delay={0} duration={1000} cascade damping={0.5} triggerOnce>
            <div className="h-screen w-screen bg-gray-200" ref={reactFlowWrapper}>
                <ReactFlow
                    onInit={() => setFlowRendered(true)}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onConnectEnd={onConnectEnd}
                    preventScrolling={false}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={{ style: edgeStyles}}
                    connectionLineStyle={edgeStyles}
                    colorMode="light"
                    defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
                >
                    <Background gap={25} />
                    {flowRendered && <CanvasInfo canvasId={canvasId} />}
                </ReactFlow>
            </div>
        </Fade>
    )
}