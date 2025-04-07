import { useState, useRef, useEffect } from "react"
import {
    Handle,
    Position,
    NodeToolbar,
    useNodeConnections,
    useNodesData,
    type Node,
} from '@xyflow/react'

import LoadingWheel from "../icons/LoadingWheel"

const backendServerURL = 'http://127.0.0.1:5000'

export type LLMNodeProps = {
    id: string
    selected: boolean
    data: Record<string, any>
}

const initalModel = "gpt-4o"
const models = [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "claude-sonnet", label: "Claude 3.5 Sonnet" },
]
const modelMapping = {
    "gpt-4o": "GPT-4o",
    "claude-sonnet": "Claude 3.5 Sonnet",
}

export default function LLMNode ({ id: nodeId, selected }: LLMNodeProps) {
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const [placeholder, setPlaceholder] = useState("")
    const [curPlaceholder, setCurPlaceholder] = useState("")
    const [placeholderIndex, setPlaceholderIndex] = useState(0)

    const [model, setModel] = useState<keyof typeof modelMapping>(initalModel)
    const [prompt, setPrompt] = useState("")
    
    const [promptResponse, setPromptResponse] = useState("")

    const [loading, setLoading] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const connections = useNodeConnections({
        handleType: 'target',
    })
    const parentNodes = useNodesData<Node>(
        connections.map((connection) => connection.source),
    )

    useEffect(() => {
        if (selected) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 0)
        }
    }, [])

    const fetchPrompt = async (signal: AbortSignal ) => {
        try {
            const response = await fetch(`${backendServerURL}/api/v1/generate-prompt`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    parentNodes,
                }),
                signal,
            })
            const { prompt } = await response.json()
            setPlaceholder(prompt)
        } catch (error) {
        }
    }

    useEffect(() => {
        // Prevent fetching prompt question twice
        const controller = new AbortController()
        const signal = controller.signal
        fetchPrompt(signal)
        return () => {
            controller.abort()
        }
    }, [])

    useEffect(() => {
        if (placeholder && placeholderIndex < placeholder.length) {
            const timer = setTimeout(() => {
                setCurPlaceholder(curPlaceholder + placeholder[placeholderIndex])
                setPlaceholderIndex(placeholderIndex + 1)
            }, 20)
            return () => {
                clearTimeout(timer)
            }
        }
    }, [curPlaceholder, placeholderIndex, placeholder])

    const submitPrompt = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        setLoading(true)

        try {
            const response = await fetch(`${backendServerURL}/api/v1/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    nodeId,
                    parentNodes,
                }),
                signal: controller.signal,
            })
            const data = await response.json()
            setPromptResponse(data.response)
        } catch(error) {
            console.error("Error:", error)
            setPromptResponse("An error occurred. Please try again.")
        } finally {
            clearTimeout(timeoutId)
            setLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)
    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => setModel(e.target.value as keyof typeof modelMapping)

    const renderModelDropdown = () => {
        if (!selected && !isHovered) return
        return (
            <NodeToolbar isVisible className="top-[-16px] bg-gray-800 p-1 pr-1.5 rounded-[16px]">
                <select
                    value={model}
                    onChange={handleModelChange}
                    className={`
                        bg-gray-800
                        border-none
                        text-white
                        py-1
                        px-3
                        rounded-md
                        focus:outline-none
                    `}
                >
                    <option value="" disabled>Select a model</option>
                    {models.map((model) => (
                        <option key={model.value} value={model.value}>
                            {model.label}
                        </option>
                    ))}
                </select>
            </NodeToolbar>
        )
    }

    const renderHandles = () => (
        <>
            <Handle
                id={nodeId}
                type="target"
                isConnectable
                position={Position.Left}
                className={`w-4 h-4 mt-[4px] rounded-lg !bg-white border-gray-800 border-2`}
            />
            <Handle
                id={nodeId}
                type="source"
                position={Position.Right}
                className="w-4 h-4 mt-[4px] rounded-lg !bg-white border-gray-800 border-2 hover:!bg-black"
            />
        </>
    )

    const renderHeaders = () => (
        <>
            <svg className="cursor-move absolute top-[-26px] left-[30px] w-[30px] h-[20px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" fill="none">
                <circle cx="5" cy="5" r="3.5" fill="#000000" />
                <circle cx="15" cy="5" r="3.5" fill="#000000" />
                <circle cx="25" cy="5" r="3.5" fill="#000000" />
                
                <circle cx="5" cy="15" r="3.5" fill="#000000" />
                <circle cx="15" cy="15" r="3.5" fill="#000000" />
                <circle cx="25" cy="15" r="3.5" fill="#000000" />
            </svg>
            <div className="absolute top-[-26px] right-[30px] w-[150px] h-[20px] text-black pointer-events-none text-right">{modelMapping[model]}</div>
        </>
    )

    const renderPromptInput = () => (
        <>
            <div className="flex justify-between">
                <textarea
                    ref={inputRef}
                    placeholder={curPlaceholder}
                    value={prompt}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            if (prompt !== "") {
                                submitPrompt()
                            }
                        } else if (e.key === "Tab" && prompt === "") {
                            e.preventDefault()
                            setPrompt(placeholder)
                        }
                    }}
                    className={`
                        h-8
                        pt-1
                        mr-1
                        flex-grow
                        focus:outline-none
                        resize-none
                    `}
                    rows={1}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = "32px"
                        target.style.height = `${target.scrollHeight}px`
                    }}
                ></textarea>
                {(selected || isHovered) ? <svg onClick={(e) => submitPrompt()} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-circle-arrow-down rounded-full bg-background-opaque-white stroke-text-dark transition-all hover:stroke-gray-600 duration-300 cursor-pointer rotate-180 ${loading && "stroke-gray-600"}`}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m16 12-4-4-4 4"></path>
                    <path d="M12 16V8"></path>
                </svg> : <div className="h-[32px] w-[32px]"></div>}
            </div>
            <div className={`border-t border-gray-300 mt-1 mb-1 group-focus-within:border-gray-800`}></div>
        </>
    )

    const renderOutput = () => {
        if (loading) {
            return <LoadingWheel />
        } else if (promptResponse) {
            return <textarea readOnly className="w-full focus:outline-none resize-none" value={promptResponse}></textarea>
        } else {
            return (
                <div className="w-full h-full flex flex-col items-center justify-around">
                    <div className="cursor-text select-text">
                        You can...
                        <br />
                        - create a packing list 🏕️
                        <br />
                        - generate a 📚 report
                        <br />
                        - come up with 🎁 ideas
                        <br />
                        - write a love letter 🌹
                    </div>
                    <div className="cursor-text select-text text-center">
                        Press ⇥ to use suggested prompt
                        <br />
                        Press ⌫ to delete this node
                    </div>
                </div>
            )
        }
    }

    return (
        <div
            className="group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {renderModelDropdown()}
            {renderHandles()}
            {renderHeaders()}
            <div className={`
                w-[400px]
                h-[500px]
                bg-white
                text-black
                border-gray-800
                rounded-[30px]
                shadow-xl
                ${isHovered && !selected && "outline-[2px] outline-orange-500"}
                ${selected && "outline-[2px] shadow-2xl"}
                group-focus-within:outline-[2px] shadow-2xl
                flex
                p-3
                flex-col
                cursor-default
                overflow-hidden
                nodrag
            `}>
                {renderPromptInput()}
                <div className="overflow-y-auto h-full flex">
                    {renderOutput()}
                </div>
            </div>
        </div>
    )
}
