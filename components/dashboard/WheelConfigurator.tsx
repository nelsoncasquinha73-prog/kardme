'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiTrash2, FiRefreshCw } from 'react-icons/fi'
import styles from './WheelConfigurator.module.css'

interface WheelSlice {
  id: string
  label: string
  color: string
  is_prize: boolean
  percentage?: number
}

interface WheelConfig {
  slices: WheelSlice[]
  capture_before_spin: boolean
  max_spins_per_email: number
}

const DEFAULT_SLICES: WheelSlice[] = [
  { id: '1', label: '🏆 Prémio Principal', color: '#f59e0b', is_prize: true, percentage: 20 },
  { id: '2', label: 'Tenta outra vez', color: '#4b5563', is_prize: false, percentage: 15 },
  { id: '3', label: '🎁 Brinde Surpresa', color: '#8b5cf6', is_prize: true, percentage: 20 },
  { id: '4', label: 'Quase!', color: '#374151', is_prize: false, percentage: 15 },
  { id: '5', label: '🥈 2º Prémio', color: '#10b981', is_prize: true, percentage: 20 },
  { id: '6', label: 'Tenta outra vez', color: '#4b5563', is_prize: false, percentage: 10 },
]

interface WheelConfiguratorProps {
  config: WheelConfig | null
  onChange: (config: WheelConfig) => void
}

export default function WheelConfigurator({ config, onChange }: WheelConfiguratorProps) {
  const [slices, setSlices] = useState<WheelSlice[]>(config?.slices || DEFAULT_SLICES)
  const [captureBeforeSpin, setCaptureBeforeSpin] = useState(config?.capture_before_spin ?? true)
  const [maxSpins, setMaxSpins] = useState(config?.max_spins_per_email ?? 1)

  const totalPercentage = slices.reduce((sum, s) => sum + (s.percentage || 0), 0)
  const isValid = totalPercentage === 100

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({
        slices,
        capture_before_spin: captureBeforeSpin,
        max_spins_per_email: maxSpins,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [slices, captureBeforeSpin, maxSpins, onChange])

  const addSlice = () => {
    const newId = String(Math.max(...slices.map(s => parseInt(s.id) || 0)) + 1)
    setSlices([
      ...slices,
      {
        id: newId,
        label: 'Novo Prémio',
        color: '#3b82f6',
        is_prize: true,
        percentage: 0,
      },
    ])
  }

  const updateSlice = (id: string, field: keyof WheelSlice, value: any) => {
    setSlices(slices.map(s => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const deleteSlice = (id: string) => {
    if (slices.length > 2) setSlices(slices.filter(s => s.id !== id))
  }

  const resetToDefault = () => {
    setSlices(DEFAULT_SLICES)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>🎡 Configuração da Roda</h4>
        <button
          type="button"
          onClick={resetToDefault}
          className={styles.resetBtn}
          title="Repor para defaults"
        >
          <FiRefreshCw size={16} /> Reset
        </button>
      </div>

      {/* Fatias */}
      <div className={styles.slicesSection}>
        <div className={styles.slicesHeader}>
          <span>Fatias ({slices.length})</span>
          <span
            className={`${styles.percentageIndicator} ${isValid ? styles.valid : styles.invalid}`}
          >
            {totalPercentage}% / 100%
          </span>
        </div>

        <div className={styles.slicesList}>
          {slices.map((slice) => (
            <div key={slice.id} className={styles.sliceCard}>
              {/* Label */}
              <div className={styles.field}>
                <label>Texto</label>
                <input
                  type="text"
                  value={slice.label}
                  onChange={(e) => updateSlice(slice.id, 'label', e.target.value)}
                  placeholder="Ex: 🏆 Prémio Principal"
                  className={styles.input}
                />
              </div>

              {/* Cor */}
              <div className={styles.field}>
                <label>Cor</label>
                <div className={styles.colorPicker}>
                  <input
                    type="color"
                    value={slice.color}
                    onChange={(e) => updateSlice(slice.id, 'color', e.target.value)}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorValue}>{slice.color}</span>
                </div>
              </div>

              {/* Percentagem */}
              <div className={styles.field}>
                <label>Probabilidade (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={slice.percentage || 0}
                  onChange={(e) =>
                    updateSlice(slice.id, 'percentage', Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className={styles.input}
                />
              </div>

              {/* Tipo */}
              <div className={styles.field}>
                <label>Tipo</label>
                <select
                  value={slice.is_prize ? 'prize' : 'retry'}
                  onChange={(e) => updateSlice(slice.id, 'is_prize', e.target.value === 'prize')}
                  className={styles.select}
                >
                  <option value="prize">🎁 Prémio</option>
                  <option value="retry">🔄 Tenta Outra Vez</option>
                </select>
              </div>

              {/* Delete */}
              {slices.length > 2 && (
                <button
                  type="button"
                  onClick={() => deleteSlice(slice.id)}
                  className={styles.deleteBtn}
                  title="Eliminar fatia"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addSlice} className={styles.addBtn}>
          <FiPlus size={16} /> Adicionar Fatia
        </button>
      </div>

      {/* Validação */}
      {!isValid && (
        <div className={styles.warning}>
          ⚠️ A soma das probabilidades tem que ser 100%. Faltam {100 - totalPercentage}%.
        </div>
      )}

      {/* Opções */}
      <div className={styles.optionsSection}>
        <div className={styles.option}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={captureBeforeSpin}
              onChange={(e) => setCaptureBeforeSpin(e.target.checked)}
            />
            <span>Recolher dados antes de girar</span>
          </label>
          <small>Se desativado, o user gira primeiro e depois preenche o formulário.</small>
        </div>

        <div className={styles.option}>
          <label>Max. Spins por Email</label>
          <input
            type="number"
            min="1"
            max="10"
            value={maxSpins}
            onChange={(e) => setMaxSpins(Math.max(1, parseInt(e.target.value) || 1))}
            className={styles.input}
          />
          <small>Quantas vezes cada pessoa pode girar.</small>
        </div>
      </div>
    </div>
  )
}
