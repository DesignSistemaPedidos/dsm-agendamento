
export default function TimeSlotPicker({ slots, selectedSlot, onSelectSlot }) {
    return (
        <div className="time-slots">
            {slots.map((slot) => (
                <button
                    key={slot}
                    className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                    onClick={() => onSelectSlot(slot)}
                >
                    {slot}
                </button>
            ))}
        </div>
    );
}
