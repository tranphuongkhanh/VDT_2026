package org.example.backend.service;

import org.example.backend.dto.request.CreateCategoryRequest;
import org.example.backend.dto.request.UpdateCategoryRequest;
import org.example.backend.dto.response.CategoryResponse;
import org.example.backend.entity.Category;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findByIsActiveTrue().stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        Category category = Category.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        Category saved = categoryRepository.save(category);
        return convertToResponse(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());

        Category saved = categoryRepository.save(category);
        return convertToResponse(saved);
    }

    @Transactional
    public CategoryResponse deactivateCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        category.setIsActive(false);
        Category saved = categoryRepository.save(category);
        return convertToResponse(saved);
    }

    private CategoryResponse convertToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
