package com.bookmycourt.common.sequence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NumberSeriesRepository extends JpaRepository<NumberSeries, NumberSeries.NumberSeriesId> {

    Optional<NumberSeries> findBySeriesAndFinancialYear(String series, String financialYear);
}
