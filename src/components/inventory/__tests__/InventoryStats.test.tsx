import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InventoryStats } from '../InventoryStats'

describe('InventoryStats', () => {
  it('should render all stat cards', () => {
    render(
      <InventoryStats
        totalProducts={150}
        lowStockCount={10}
        outOfStockCount={5}
        totalValue={50000}
      />
    )

    expect(screen.getByText('Total de Produtos')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    
    expect(screen.getByText('Estoque Baixo')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    
    expect(screen.getByText('Sem Estoque')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    
    expect(screen.getByText('Valor Total')).toBeInTheDocument()
  })

  it('should format currency correctly', () => {
    render(
      <InventoryStats
        totalProducts={100}
        lowStockCount={0}
        outOfStockCount={0}
        totalValue={12345.67}
      />
    )

    // Check if value is formatted as Brazilian currency
    expect(screen.getByText(/R\$/)).toBeInTheDocument()
    expect(screen.getByText(/12\.345,67/)).toBeInTheDocument()
  })

  it('should show zero values correctly', () => {
    render(
      <InventoryStats
        totalProducts={0}
        lowStockCount={0}
        outOfStockCount={0}
        totalValue={0}
      />
    )

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('R$ 0,00')).toBeInTheDocument()
  })

  it('should highlight critical values with colors', () => {
    const { container } = render(
      <InventoryStats
        totalProducts={100}
        lowStockCount={25}
        outOfStockCount={15}
        totalValue={5000}
      />
    )

    // Check for colored text (yellow for low stock, red for out of stock)
    const lowStockValue = screen.getByText('25')
    const outOfStockValue = screen.getByText('15')
    
    expect(lowStockValue).toHaveClass('text-yellow-600')
    expect(outOfStockValue).toHaveClass('text-red-600')
  })

  it('should render descriptive labels', () => {
    render(
      <InventoryStats
        totalProducts={50}
        lowStockCount={3}
        outOfStockCount={1}
        totalValue={10000}
      />
    )

    expect(screen.getByText('Produtos cadastrados')).toBeInTheDocument()
    expect(screen.getByText('Produtos com estoque baixo')).toBeInTheDocument()
    expect(screen.getByText('Produtos sem estoque')).toBeInTheDocument()
    expect(screen.getByText(/Valor em estoque/)).toBeInTheDocument()
  })
})
