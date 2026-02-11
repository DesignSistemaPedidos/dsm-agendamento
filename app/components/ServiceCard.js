
export default function ServiceCard({ service, selected, onSelect }) {
    return (
        <div
            className={`card ${selected ? 'card-selected' : ''}`}
            onClick={() => onSelect(service)}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            <div className="flex-between mb-4">
                <span style={{ fontSize: '2rem' }}>{service.icon || '✂️'}</span>
                {selected && <span className="badge badge-gold">Selecionado</span>}
            </div>
            <h3 className="mb-2" style={{ fontSize: '1.2rem' }}>{service.name}</h3>
            <p className="text-gray text-sm mb-4" style={{ flexGrow: 1 }}>{service.description}</p>
            <div className="flex-between mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-gray">⏱️ {service.duration} min</span>
                <div className="font-bold text-gold">R$ {service.price.toFixed(2)}</div>
            </div>
        </div>
    );
}
