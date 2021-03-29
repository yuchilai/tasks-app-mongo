package yuchi.springframework.repository;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import yuchi.springframework.domain.Tasks;

/**
 * Spring Data MongoDB reactive repository for the Tasks entity.
 */
@SuppressWarnings("unused")
@Repository
public interface TasksRepository extends ReactiveMongoRepository<Tasks, String> {}
