
import { useState } from 'react';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Calendar({ selectedDate, onSelectDate }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Verificar se é data passada ou domingo (exemplo)
        if (newDate < new Date().setHours(0, 0, 0, 0)) return;
        onSelectDate(newDate);
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getFullYear() === currentDate.getFullYear()
        );
    };

    const isToday = (day) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear()
        );
    };

    return (
        <div className="calendar">
            <div className="calendar-header">
                <h4>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
                <div className="calendar-nav">
                    <button className="btn btn-sm btn-secondary" onClick={prevMonth}>&lt;</button>
                    <button className="btn btn-sm btn-secondary" onClick={nextMonth}>&gt;</button>
                </div>
            </div>
            <div className="calendar-grid">
                {DAYS.map(day => (
                    <div key={day} className="calendar-weekday">{day}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day other-month"></div>
                ))}
                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const isDisabled = new Date(currentDate.getFullYear(), currentDate.getMonth(), day) < new Date().setHours(0, 0, 0, 0);
                    return (
                        <button
                            key={day}
                            className={`calendar-day ${isSelected(day) ? 'selected' : ''} ${isToday(day) ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && handleDayClick(day)}
                            disabled={isDisabled}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
