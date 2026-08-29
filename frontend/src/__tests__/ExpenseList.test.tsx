import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseList } from '../components/ExpenseList';
import { ExpenseDTO, PaginatedData } from '@expense-tracker/shared';

const mockExpenses: ExpenseDTO[] = [
  {
    id: 'exp-1',
    amount: 2550, // $25.50
    description: 'Dinner at Italian Place',
    date: '2026-08-15T18:30:00.000Z',
    paymentMethod: 'CREDIT_CARD',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Food & Dining',
      color: '#EF4444',
      isDefault: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    userId: 'user-1',
    createdAt: '2026-08-15T18:30:00.000Z',
    updatedAt: '2026-08-15T18:30:00.000Z',
  },
  {
    id: 'exp-2',
    amount: 1200, // $12.00
    description: 'Subway Pass',
    date: '2026-08-16T08:00:00.000Z',
    paymentMethod: 'DEBIT_CARD',
    categoryId: 'cat-2',
    category: {
      id: 'cat-2',
      name: 'Transportation',
      color: '#F97316',
      isDefault: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    userId: 'user-1',
    createdAt: '2026-08-16T08:00:00.000Z',
    updatedAt: '2026-08-16T08:00:00.000Z',
  },
];

const mockPagination: PaginatedData<ExpenseDTO>['pagination'] = {
  total: 15,
  page: 1,
  limit: 10,
  totalPages: 2,
  hasMore: true,
};

describe('ExpenseList Component', () => {
  it('should render loading spinner when isLoading is true', () => {
    render(
      <ExpenseList
        expenses={[]}
        pagination={mockPagination}
        isLoading={true}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onPageChange={jest.fn()}
      />
    );

    expect(screen.getByText(/loading your expenses/i)).toBeInTheDocument();
  });

  it('should render empty state message when there are no expenses', () => {
    render(
      <ExpenseList
        expenses={[]}
        pagination={{ ...mockPagination, total: 0 }}
        isLoading={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onPageChange={jest.fn()}
      />
    );

    expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
  });

  it('should render expenses with correct descriptions and formatted dollar amounts', () => {
    render(
      <ExpenseList
        expenses={mockExpenses}
        pagination={mockPagination}
        isLoading={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onPageChange={jest.fn()}
      />
    );

    expect(screen.getAllByText('Dinner at Italian Place').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$25.50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Subway Pass').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$12.00').length).toBeGreaterThan(0);
  });

  it('should trigger onEdit and onDelete callbacks when buttons are clicked', () => {
    const handleEdit = jest.fn();
    const handleDelete = jest.fn();

    render(
      <ExpenseList
        expenses={mockExpenses}
        pagination={mockPagination}
        isLoading={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPageChange={jest.fn()}
      />
    );

    const editButtons = screen.getAllByLabelText(/edit/i);
    fireEvent.click(editButtons[0]);
    expect(handleEdit).toHaveBeenCalledWith(mockExpenses[0]);

    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);
    expect(handleDelete).toHaveBeenCalledWith(mockExpenses[0].id);
  });

  it('should handle pagination next and previous button clicks', () => {
    const handlePageChange = jest.fn();

    render(
      <ExpenseList
        expenses={mockExpenses}
        pagination={mockPagination}
        isLoading={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onPageChange={handlePageChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);
    expect(handlePageChange).toHaveBeenCalledWith(2);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled(); // page 1
  });
});
