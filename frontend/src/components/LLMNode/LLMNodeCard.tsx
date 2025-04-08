export default function LLMNodeCard() {
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
                Click on → icon and drag to create node
                <br />
                Click on ⋮⋮⋮ and drag to move node
                <br />
                Press ⇥ to use suggested prompt
                <br />
                Press ⌫ to delete selected node
            </div>
        </div>
    )
}
