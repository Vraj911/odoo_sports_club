package com.bookmycourt.common.sequence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "number_series")
@IdClass(NumberSeries.NumberSeriesId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NumberSeries {

    @Id
    @Column(nullable = false, length = 40)
    private String series;

    @Id
    @Column(name = "financial_year", nullable = false, length = 9)
    private String financialYear;

    @Column(name = "last_number", nullable = false)
    private long lastNumber;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NumberSeriesId implements Serializable {
        private String series;
        private String financialYear;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            NumberSeriesId that = (NumberSeriesId) o;
            return Objects.equals(series, that.series) && Objects.equals(financialYear, that.financialYear);
        }

        @Override
        public int hashCode() {
            return Objects.hash(series, financialYear);
        }
    }
}
