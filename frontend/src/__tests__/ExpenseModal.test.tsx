import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseModal } from '../components/ExpenseModal';
import { CategoryDTO, ExpenseDTO } from '@expense-tracker/shared';

const mockCategories: CategoryDTO[] = [
  {
    id: 'cat-1',
    name: 'Food & Dining',
    color: '#EF4444',
    isDefault: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'cat-2',
    name: 'Transportation',
    color: '#F97316',
    isDefault: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

// Use fake timers to control the 300ms debounce in handleDescriptionChange
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('ExpenseModal Component', () => {
  it('should render nothing when isOpen is false', () => {
    const { container } = render(
      <ExpenseModal
        isOpen={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        categories={mockCategories}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render form fields when isOpen is true for adding a new expense', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        categories={mockCategories}
      />
    );

    expect(screen.getByRole('heading', { name: /add new expense/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
  });

  it('should convert dollar input into integer cents upon submission', async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    const handleClose = jest.fn();

    render(
      <ExpenseModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        categories={mockCategories}
      />
    );

    const amountInput = screen.getByLabelText(/amount/i);
    const descInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /add expense/i });

    // Use act + fireEvent to avoid act() warning from state updates in jsdom
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '49.99' } });
      fireEvent.change(descInput, { target: { value: 'Weekly Groceries' } });
      jest.runAllTimers(); // flush debounce
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 4999, // Converted to integer cents ($49.99 * 100)
        description: 'Weekly Groceries',
        categoryId: 'cat-1',
        paymentMethod: 'CREDIT_CARD',
      })
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('should display error message when amount is zero or negative', async () => {
    const handleSubmit = jest.fn();

    render(
      <ExpenseModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={handleSubmit}
        categories={mockCategories}
      />
    );

    const amountInput = screen.getByLabelText(/amount/i);
    const descInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /add expense/i });

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.change(descInput, { target: { value: 'Free Item' } });
      jest.runAllTimers();
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(
      screen.getByText(/please enter a valid amount greater than \$0\.00/i)
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should pre-populate inputs when editing an existing expense', () => {
    const existingExpense: ExpenseDTO = {
      id: 'exp-123',
      amount: 7525, // $75.25
      description: 'Electric Bill',
      date: '2026-08-10T00:00:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      isRecurring: false,
      categoryId: 'cat-2',
      notes: 'Paid via direct debit',
      userId: 'user-1',
      createdAt: '2026-08-10',
      updatedAt: '2026-08-10',
    };

    render(
      <ExpenseModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        expenseToEdit={existingExpense}
        categories={mockCategories}
      />
    );

    expect(screen.getByRole('heading', { name: /edit expense/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toHaveValue(75.25);
    expect(screen.getByLabelText(/description/i)).toHaveValue('Electric Bill');
    expect(screen.getByLabelText(/category/i)).toHaveValue('cat-2');
    expect(screen.getByLabelText(/payment method/i)).toHaveValue('BANK_TRANSFER');
    expect(screen.getByLabelText(/notes/i)).toHaveValue('Paid via direct debit');
  });

  it('should show a category suggestion banner for recognized descriptions', async () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        categories={mockCategories}
      />
    );

    const descInput = screen.getByLabelText(/description/i);

    await act(async () => {
      fireEvent.change(descInput, { target: { value: 'Starbucks latte' } });
      jest.runAllTimers(); // flush the 300ms debounce
    });

    expect(screen.getByRole('status')).toHaveTextContent(/suggested category/i);
    expect(screen.getByRole('status')).toHaveTextContent(/food & dining/i);
  });

  it('should hide the suggestion banner when user clicks Dismiss', async () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        categories={mockCategories}
      />
    );

    const descInput = screen.getByLabelText(/description/i);

    await act(async () => {
      fireEvent.change(descInput, { target: { value: 'Uber ride' } });
      jest.runAllTimers();
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /dismiss suggestion/i }));
    });

    expect(screen.queryByRole('status')).toBeNull();
  });
});
