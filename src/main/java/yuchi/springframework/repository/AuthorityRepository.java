package yuchi.springframework.repository;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import yuchi.springframework.domain.Authority;

/**
 * Spring Data MongoDB repository for the {@link Authority} entity.
 */
public interface AuthorityRepository extends ReactiveMongoRepository<Authority, String> {}
