export default function LLMNodeCard() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-around llm-node-card">
            <div className="cursor-text select-text">
                <span>You can...</span>
                <br />
                <span>- create a packing list 🏕️</span>
                <br />
                <span>- generate a 📚 report</span>
                <br />
                <span>- come up with 🎁 ideas</span>
                <br />
                <span>- write a love letter 🌹</span>
            </div>
            <div className="cursor-text select-text text-center">
                <span>Click on → icon and drag to create node</span>
                <br />
                <span>Click on ⋮⋮⋮ and drag to move node</span>
                <br />
                <span>Press ⇥ to use suggested prompt</span>
                <br />
                <span>Press ⌫ to delete selected node</span>
            </div>
        </div>
    )
}
