
export default function BarberCard({ barber, selected, onSelect }) {
    return (
        <div
            className={`card text-center ${selected ? 'card-selected' : ''}`}
            onClick={() => onSelect(barber)}
            style={{ cursor: 'pointer' }}
        >
            <div className="avatar avatar-xl mb-4" style={{ margin: '0 auto' }}>
                <img src={barber.avatar} alt={barber.name} />
            </div>
            <h3 className="mb-1" style={{ fontSize: '1.1rem' }}>{barber.name}</h3>
            <p className="text-gold text-sm mb-3">{barber.specialty}</p>
            {selected ? (
                <button className="btn btn-sm btn-primary w-full">Selecionado</button>
            ) : (
                <button className="btn btn-sm btn-outline w-full">Escolher</button>
            )}
        </div>
    );
}
