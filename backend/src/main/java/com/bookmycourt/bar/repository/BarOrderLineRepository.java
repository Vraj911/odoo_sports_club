package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface BarOrderLineRepository extends JpaRepository<BarOrderLine, UUID> {
    List<BarOrderLine> findByBarOrder_Id(UUID barOrderId);
    List<BarOrderLine> findByKitchenStatusIn(List<String> statuses);

    /** KDS feed in one query (order, table, item, waiter fetched) - oldest ticket first. */
    @Query("""
            select l from BarOrderLine l
              join fetch l.barOrder o
              left join fetch o.table
              left join fetch l.orderedBy
            where l.kitchenStatus in :statuses
            order by l.sentAt asc
            """)
    List<BarOrderLine> findKds(@Param("statuses") Collection<String> statuses);
}