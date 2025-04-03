import { useState, useRef, useEffect } from "react"
import { Handle, Position, NodeToolbar } from '@xyflow/react'

import LoadingWheel from "../icons/LoadingWheel"

export type NodeProps = {
    id: string
    selected: boolean
}

export default function LLMNode ({ selected, id }: NodeProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [model, setModel] = useState("chatgpt")
    const [prompt, setPrompt] = useState("")
    const [promptResponse , setPromptResponse] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (selected && inputRef.current) {
            inputRef.current.focus()
        }
    }, [selected])

    const submitPrompt = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        setLoading(true)

        try {
            const response = await fetch("http://127.0.0.1:5000/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ model, prompt }),
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)
    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => setModel(e.target.value)

    return (
        <>
            <NodeToolbar isVisible className="bg-gray-800 p-2 rounded-[20px]">
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
                    <option value="chatgpt">ChatGPT</option>
                    <option value="claude">Claude</option>
                </select>
            </NodeToolbar>
            <Handle
                id={id}
                type="target"
                isConnectable={false}
                position={Position.Left}
                className="invisible"
            />
            <Handle
                id={id}
                type="source"
                position={Position.Right}
                className="w-4 h-4 mt-[4px] rounded-lg !bg-white border-gray-500 border-2"
            />
            <div className={`
                w-[400px]
                h-[500px]
                bg-white
                text-black
                border-gray-800
                rounded-[20px]
                shadow-xl
                ${selected && "outline shadow-2xl"}
                flex
                p-3
                flex-col
                cursor-default
                overflow-hidden
            `}>
                <div className="flex justify-between">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="What is your prompt?"
                        value={prompt}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                submitPrompt()
                            }
                        }}
                        className="h-8 mr-1 flex-grow focus:outline-none"
                    />
                    <svg onClick={(e) => submitPrompt()} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-circle-arrow-down rounded-full bg-background-opaque-white stroke-text-dark transition-all hover:stroke-gray-600 duration-300 cursor-pointer rotate-180 ${loading && "stroke-gray-600"}`}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m16 12-4-4-4 4"></path>
                        <path d="M12 16V8"></path>
                    </svg>
                </div>
                <div className={`border-t border-gray-300 mt-1 mb-1 ${selected && "border-gray-800"}`}></div>
                <div className="overflow-y-auto h-full flex">
                    {loading ? (
                        <LoadingWheel />
                    ) : promptResponse ? promptResponse : (
                        <div className="flex flex-col items-center w-full h-full">
                            <div className="my-[100px] p-3 text-gray-600 text-[18px]">
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
                            <div>
                                Press ⌫ to delete this node
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
