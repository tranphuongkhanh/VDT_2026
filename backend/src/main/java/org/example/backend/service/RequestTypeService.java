package org.example.backend.service;

import org.example.backend.dto.request.CreateRequestTypeRequest;
import org.example.backend.dto.request.UpdateRequestTypeRequest;
import org.example.backend.dto.response.RequestTypeResponse;
import org.example.backend.entity.RequestType;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.entity.Category;
import org.example.backend.repository.CategoryRepository;
import org.example.backend.repository.RequestTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RequestTypeService {

    private final RequestTypeRepository requestTypeRepository;
    private final CategoryRepository categoryRepository;

    public RequestTypeService(
            RequestTypeRepository requestTypeRepository,
            CategoryRepository categoryRepository) {
        this.requestTypeRepository = requestTypeRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<RequestTypeResponse> getActiveRequestTypes() {
        return requestTypeRepository.findByIsActiveTrueOrderBySortOrderAsc().stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RequestTypeResponse> getAllRequestTypes() {
        return requestTypeRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<RequestTypeResponse> getRequestTypes(
            String search, Long categoryId, Boolean isActive, Pageable pageable) {
        String searchParam = null;
        if (search != null && !search.trim().isEmpty()) {
            searchParam = "%" + search.trim().toLowerCase() + "%";
        }
        return requestTypeRepository.findRequestTypesWithFilters(searchParam, categoryId, isActive, pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public RequestTypeResponse getRequestTypeById(Long id) {
        RequestType requestType = requestTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request type not found with id: " + id));
        return convertToResponse(requestType);
    }

    @Transactional
    public RequestTypeResponse createRequestType(CreateRequestTypeRequest request) {
        String formattedCode = request.getCode().trim().toUpperCase();
        if (requestTypeRepository.findByCode(formattedCode).isPresent()) {
            throw new BadRequestException("Request type code '" + formattedCode + "' already exists");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        }

        RequestType requestType = RequestType.builder()
                .code(formattedCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .icon(request.getIcon())
                .category(category)
                .isActive(true)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        RequestType saved = requestTypeRepository.save(requestType);
        return convertToResponse(saved);
    }

    @Transactional
    public RequestTypeResponse updateRequestType(Long id, UpdateRequestTypeRequest request) {
        RequestType requestType = requestTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request type not found with id: " + id));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        }

        requestType.setName(request.getName().trim());
        requestType.setDescription(request.getDescription());
        requestType.setIcon(request.getIcon());
        requestType.setCategory(category);
        requestType.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        requestType.setUpdatedAt(LocalDateTime.now());

        RequestType saved = requestTypeRepository.save(requestType);
        return convertToResponse(saved);
    }

    @Transactional
    public void deactivateRequestType(Long id) {
        RequestType requestType = requestTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request type not found with id: " + id));

        requestType.setIsActive(false);
        requestType.setUpdatedAt(LocalDateTime.now());
        requestTypeRepository.save(requestType);
    }

    private RequestTypeResponse convertToResponse(RequestType requestType) {
        Category category = requestType.getCategory();
        return RequestTypeResponse.builder()
                .id(requestType.getId())
                .code(requestType.getCode())
                .name(requestType.getName())
                .description(requestType.getDescription())
                .icon(requestType.getIcon())
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getName() : null)
                .isActive(requestType.getIsActive())
                .sortOrder(requestType.getSortOrder())
                .createdAt(requestType.getCreatedAt())
                .updatedAt(requestType.getUpdatedAt())
                .build();
    }
}
