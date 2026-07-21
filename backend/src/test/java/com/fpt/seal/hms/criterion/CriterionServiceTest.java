package com.fpt.seal.hms.criterion;

import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.criterion.dto.CriterionRequest;
import com.fpt.seal.hms.criterion.dto.CriterionResponse;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.round.RoundRepository;
import com.fpt.seal.hms.round.entity.Round;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CriterionServiceTest {

    @Mock private CriterionRepository criterionRepository;
    @Mock private RoundRepository roundRepository;
    @InjectMocks private CriterionService criterionService;

    private Round round(long id) {
        Round r = new Round();
        r.setId(id);
        return r;
    }

    private Criterion criterion(long id, Round round, String name, String weight) {
        Criterion c = new Criterion();
        c.setId(id);
        c.setRound(round);
        c.setName(name);
        c.setWeight(new BigDecimal(weight));
        c.setMaxScore(new BigDecimal("100"));
        return c;
    }

    private CriterionRequest request(String name, String weight) {
        CriterionRequest r = new CriterionRequest();
        r.setName(name);
        r.setWeight(new BigDecimal(weight));
        r.setMaxScore(new BigDecimal("100"));
        return r;
    }

    @Test
    void createCriterion_persists_whenWeightWithinTotal() {
        Round r = round(1L);
        when(roundRepository.findById(1L)).thenReturn(Optional.of(r));
        when(criterionRepository.findByRoundId(1L)).thenReturn(List.of(criterion(10L, r, "Tech", "40")));
        when(criterionRepository.save(any(Criterion.class))).thenAnswer(inv -> inv.getArgument(0));

        CriterionResponse res = criterionService.createCriterion(1L, request("Design", "30"));

        assertThat(res.getName()).isEqualTo("Design");
        assertThat(res.getWeight()).isEqualByComparingTo("30");
    }

    @Test
    void createCriterion_throws_whenTotalWeightExceeds100() {
        Round r = round(1L);
        when(roundRepository.findById(1L)).thenReturn(Optional.of(r));
        when(criterionRepository.findByRoundId(1L)).thenReturn(List.of(
                criterion(10L, r, "Tech", "60"), criterion(11L, r, "Design", "30")));

        assertThatThrownBy(() -> criterionService.createCriterion(1L, request("Impact", "20")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cannot exceed 100");
        verify(criterionRepository, never()).save(any());
    }

    @Test
    void createCriterion_allowsExactly100() {
        Round r = round(1L);
        when(roundRepository.findById(1L)).thenReturn(Optional.of(r));
        when(criterionRepository.findByRoundId(1L)).thenReturn(List.of(criterion(10L, r, "Tech", "70")));
        when(criterionRepository.save(any(Criterion.class))).thenAnswer(inv -> inv.getArgument(0));

        CriterionResponse res = criterionService.createCriterion(1L, request("Design", "30"));

        assertThat(res.getWeight()).isEqualByComparingTo("30"); // 70+30 = 100 exactly, allowed
    }

    @Test
    void createCriterion_throws_whenRoundMissing() {
        when(roundRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> criterionService.createCriterion(9L, request("X", "10")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateCriterion_excludesOwnWeightFromTotal() {
        Round r = round(1L);
        Criterion own = criterion(10L, r, "Tech", "50");
        when(criterionRepository.findById(10L)).thenReturn(Optional.of(own));
        // existing total (incl. own 50) = 90; updating own to 60 -> others(40)+60 = 100, allowed
        when(criterionRepository.findByRoundId(1L)).thenReturn(List.of(own, criterion(11L, r, "Design", "40")));
        when(criterionRepository.save(any(Criterion.class))).thenAnswer(inv -> inv.getArgument(0));

        CriterionResponse res = criterionService.updateCriterion(10L, request("Tech", "60"));

        assertThat(res.getWeight()).isEqualByComparingTo("60");
    }

    @Test
    void deleteCriterion_throws_whenMissing() {
        when(criterionRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> criterionService.deleteCriterion(9L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(criterionRepository, never()).delete(any());
    }
}
