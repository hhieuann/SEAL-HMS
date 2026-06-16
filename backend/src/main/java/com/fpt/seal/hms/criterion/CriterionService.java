package com.fpt.seal.hms.criterion;

import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.criterion.dto.CriterionRequest;
import com.fpt.seal.hms.criterion.dto.CriterionResponse;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.round.RoundRepository;
import com.fpt.seal.hms.round.entity.Round;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CriterionService {

    private final CriterionRepository criterionRepository;
    private final RoundRepository roundRepository;

    @Transactional(readOnly = true)
    public List<CriterionResponse> getCriteriaByRoundId(Long roundId) {
        return criterionRepository.findByRoundId(roundId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CriterionResponse getCriterionById(Long id) {
        Criterion criterion = findCriterionEntityById(id);
        return mapToResponse(criterion);
    }

    @Transactional
    public CriterionResponse createCriterion(Long roundId, CriterionRequest request) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round not found with id: " + roundId));

        validateWeightTotal(roundId, null, request.getWeight());

        Criterion criterion = new Criterion();
        criterion.setRound(round);
        criterion.setName(request.getName());
        criterion.setMaxScore(request.getMaxScore());
        criterion.setWeight(request.getWeight());

        return mapToResponse(criterionRepository.save(criterion));
    }

    @Transactional
    public CriterionResponse updateCriterion(Long id, CriterionRequest request) {
        Criterion criterion = findCriterionEntityById(id);

        validateWeightTotal(criterion.getRound().getId(), id, request.getWeight());

        criterion.setName(request.getName());
        criterion.setMaxScore(request.getMaxScore());
        criterion.setWeight(request.getWeight());

        return mapToResponse(criterionRepository.save(criterion));
    }

    @Transactional
    public void deleteCriterion(Long id) {
        Criterion criterion = findCriterionEntityById(id);
        criterionRepository.delete(criterion);
    }

    private void validateWeightTotal(Long roundId, Long currentCriterionId, BigDecimal newWeight) {
        List<Criterion> existingCriteria = criterionRepository.findByRoundId(roundId);
        
        BigDecimal currentSum = BigDecimal.ZERO;
        for (Criterion c : existingCriteria) {
            // If we are updating, skip the old weight of the current criterion
            if (currentCriterionId != null && c.getId().equals(currentCriterionId)) {
                continue;
            }
            currentSum = currentSum.add(c.getWeight());
        }

        BigDecimal futureSum = currentSum.add(newWeight);
        if (futureSum.compareTo(new BigDecimal("100.00")) > 0) {
            throw new BusinessException("Total weight of all criteria for this round cannot exceed 100. Current future sum would be: " + futureSum);
        }
    }

    private Criterion findCriterionEntityById(Long id) {
        return criterionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Criterion not found with id: " + id));
    }

    private CriterionResponse mapToResponse(Criterion criterion) {
        CriterionResponse response = new CriterionResponse();
        response.setId(criterion.getId());
        response.setRoundId(criterion.getRound().getId());
        response.setName(criterion.getName());
        response.setMaxScore(criterion.getMaxScore());
        response.setWeight(criterion.getWeight());
        return response;
    }
}
