package com.bookmycourt.finance.mapper;

import com.bookmycourt.finance.dto.ExpenseResponse;
import com.bookmycourt.finance.dto.InvoiceLineResponse;
import com.bookmycourt.finance.dto.InvoiceResponse;
import com.bookmycourt.finance.entity.Expense;
import com.bookmycourt.finance.entity.Invoice;
import com.bookmycourt.finance.entity.InvoiceLine;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class FinanceMapper {

    public InvoiceLineResponse toResponse(InvoiceLine line) {
        return new InvoiceLineResponse(
                line.getId(),
                line.getDescription(),
                line.getSourceType(),
                line.getSourceId(),
                line.getQuantity(),
                line.getUnitPrice(),
                line.getTaxRate(),
                line.getTaxAmount(),
                line.getLineTotal(),
                line.getCreatedAt()
        );
    }

    public InvoiceResponse toResponse(Invoice inv) {
        String memberName = null;
        if (inv.getMember() != null) {
            memberName = inv.getMember().getFirstName() + " " + inv.getMember().getLastName();
        }
        List<InvoiceLineResponse> lines = inv.getLines() == null
                ? Collections.emptyList()
                : inv.getLines().stream().map(this::toResponse).toList();

        return new InvoiceResponse(
                inv.getId(),
                inv.getInvoiceNumber(),
                inv.getMember() == null ? null : inv.getMember().getId(),
                memberName,
                inv.getStatus(),
                inv.getIssueDate(),
                inv.getDueDate(),
                inv.getSubtotal(),
                inv.getTaxTotal(),
                inv.getTotal(),
                inv.getAmountPaid(),
                inv.getCurrency(),
                inv.getNotes(),
                lines,
                inv.getCreatedAt()
        );
    }

    public ExpenseResponse toResponse(Expense exp) {
        String recordedByName = null;
        if (exp.getRecordedBy() != null) {
            recordedByName = exp.getRecordedBy().getFirstName() + " " + exp.getRecordedBy().getLastName();
        }
        return new ExpenseResponse(
                exp.getId(),
                exp.getExpenseNumber(),
                exp.getExpenseType(),
                exp.getDescription(),
                exp.getAmount(),
                exp.getPaymentMethod(),
                exp.getIncurredAt(),
                recordedByName,
                exp.getNotes(),
                exp.getCreatedAt()
        );
    }
}
