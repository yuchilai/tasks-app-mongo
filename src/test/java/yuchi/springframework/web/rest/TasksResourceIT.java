package yuchi.springframework.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import yuchi.springframework.IntegrationTest;
import yuchi.springframework.domain.Tasks;
import yuchi.springframework.repository.TasksRepository;

/**
 * Integration tests for the {@link TasksResource} REST controller.
 */
@IntegrationTest
@AutoConfigureWebTestClient
@WithMockUser
class TasksResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final LocalDate DEFAULT_DUE_DATE = LocalDate.ofEpochDay(0L);
    private static final LocalDate UPDATED_DUE_DATE = LocalDate.now(ZoneId.systemDefault());

    private static final Boolean DEFAULT_COMPLETED = false;
    private static final Boolean UPDATED_COMPLETED = true;

    private static final String ENTITY_API_URL = "/api/tasks";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private TasksRepository tasksRepository;

    @Autowired
    private WebTestClient webTestClient;

    private Tasks tasks;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Tasks createEntity() {
        Tasks tasks = new Tasks().name(DEFAULT_NAME).dueDate(DEFAULT_DUE_DATE).completed(DEFAULT_COMPLETED);
        return tasks;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Tasks createUpdatedEntity() {
        Tasks tasks = new Tasks().name(UPDATED_NAME).dueDate(UPDATED_DUE_DATE).completed(UPDATED_COMPLETED);
        return tasks;
    }

    @BeforeEach
    public void initTest() {
        tasksRepository.deleteAll().block();
        tasks = createEntity();
    }

    @Test
    void createTasks() throws Exception {
        int databaseSizeBeforeCreate = tasksRepository.findAll().collectList().block().size();
        // Create the Tasks
        webTestClient
            .post()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(tasks))
            .exchange()
            .expectStatus()
            .isCreated();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeCreate + 1);
        Tasks testTasks = tasksList.get(tasksList.size() - 1);
        assertThat(testTasks.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testTasks.getDueDate()).isEqualTo(DEFAULT_DUE_DATE);
        assertThat(testTasks.getCompleted()).isEqualTo(DEFAULT_COMPLETED);
    }

    @Test
    void createTasksWithExistingId() throws Exception {
        // Create the Tasks with an existing ID
        tasks.setId("existing_id");

        int databaseSizeBeforeCreate = tasksRepository.findAll().collectList().block().size();

        // An entity with an existing ID cannot be created, so this API call must fail
        webTestClient
            .post()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(tasks))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    void getAllTasksAsStream() {
        // Initialize the database
        tasksRepository.save(tasks).block();

        List<Tasks> tasksList = webTestClient
            .get()
            .uri(ENTITY_API_URL)
            .accept(MediaType.APPLICATION_NDJSON)
            .exchange()
            .expectStatus()
            .isOk()
            .expectHeader()
            .contentTypeCompatibleWith(MediaType.APPLICATION_NDJSON)
            .returnResult(Tasks.class)
            .getResponseBody()
            .filter(tasks::equals)
            .collectList()
            .block(Duration.ofSeconds(5));

        assertThat(tasksList).isNotNull();
        assertThat(tasksList).hasSize(1);
        Tasks testTasks = tasksList.get(0);
        assertThat(testTasks.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testTasks.getDueDate()).isEqualTo(DEFAULT_DUE_DATE);
        assertThat(testTasks.getCompleted()).isEqualTo(DEFAULT_COMPLETED);
    }

    @Test
    void getAllTasks() {
        // Initialize the database
        tasksRepository.save(tasks).block();

        // Get all the tasksList
        webTestClient
            .get()
            .uri(ENTITY_API_URL + "?sort=id,desc")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isOk()
            .expectHeader()
            .contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.[*].id")
            .value(hasItem(tasks.getId()))
            .jsonPath("$.[*].name")
            .value(hasItem(DEFAULT_NAME))
            .jsonPath("$.[*].dueDate")
            .value(hasItem(DEFAULT_DUE_DATE.toString()))
            .jsonPath("$.[*].completed")
            .value(hasItem(DEFAULT_COMPLETED.booleanValue()));
    }

    @Test
    void getTasks() {
        // Initialize the database
        tasksRepository.save(tasks).block();

        // Get the tasks
        webTestClient
            .get()
            .uri(ENTITY_API_URL_ID, tasks.getId())
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isOk()
            .expectHeader()
            .contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.id")
            .value(is(tasks.getId()))
            .jsonPath("$.name")
            .value(is(DEFAULT_NAME))
            .jsonPath("$.dueDate")
            .value(is(DEFAULT_DUE_DATE.toString()))
            .jsonPath("$.completed")
            .value(is(DEFAULT_COMPLETED.booleanValue()));
    }

    @Test
    void getNonExistingTasks() {
        // Get the tasks
        webTestClient
            .get()
            .uri(ENTITY_API_URL_ID, Long.MAX_VALUE)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isNotFound();
    }

    @Test
    void putNewTasks() throws Exception {
        // Initialize the database
        tasksRepository.save(tasks).block();

        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();

        // Update the tasks
        Tasks updatedTasks = tasksRepository.findById(tasks.getId()).block();
        updatedTasks.name(UPDATED_NAME).dueDate(UPDATED_DUE_DATE).completed(UPDATED_COMPLETED);

        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, updatedTasks.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(updatedTasks))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
        Tasks testTasks = tasksList.get(tasksList.size() - 1);
        assertThat(testTasks.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testTasks.getDueDate()).isEqualTo(UPDATED_DUE_DATE);
        assertThat(testTasks.getCompleted()).isEqualTo(UPDATED_COMPLETED);
    }

    @Test
    void putNonExistingTasks() throws Exception {
        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();
        tasks.setId(UUID.randomUUID().toString());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, tasks.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(tasks))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void putWithIdMismatchTasks() throws Exception {
        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();
        tasks.setId(UUID.randomUUID().toString());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(tasks))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void putWithMissingIdPathParamTasks() throws Exception {
        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();
        tasks.setId(UUID.randomUUID().toString());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(tasks))
            .exchange()
            .expectStatus()
            .isEqualTo(405);

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void partialUpdateTasksWithPatch() throws Exception {
        // Initialize the database
        tasksRepository.save(tasks).block();

        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();

        // Update the tasks using partial update
        Tasks partialUpdatedTasks = new Tasks();
        partialUpdatedTasks.setId(tasks.getId());

        partialUpdatedTasks.name(UPDATED_NAME).dueDate(UPDATED_DUE_DATE);

        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, partialUpdatedTasks.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(partialUpdatedTasks))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
        Tasks testTasks = tasksList.get(tasksList.size() - 1);
        assertThat(testTasks.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testTasks.getDueDate()).isEqualTo(UPDATED_DUE_DATE);
        assertThat(testTasks.getCompleted()).isEqualTo(DEFAULT_COMPLETED);
    }

    @Test
    void fullUpdateTasksWithPatch() throws Exception {
        // Initialize the database
        tasksRepository.save(tasks).block();

        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();

        // Update the tasks using partial update
        Tasks partialUpdatedTasks = new Tasks();
        partialUpdatedTasks.setId(tasks.getId());

        partialUpdatedTasks.name(UPDATED_NAME).dueDate(UPDATED_DUE_DATE).completed(UPDATED_COMPLETED);

        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, partialUpdatedTasks.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(partialUpdatedTasks))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
        Tasks testTasks = tasksList.get(tasksList.size() - 1);
        assertThat(testTasks.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testTasks.getDueDate()).isEqualTo(UPDATED_DUE_DATE);
        assertThat(testTasks.getCompleted()).isEqualTo(UPDATED_COMPLETED);
    }

    @Test
    void patchNonExistingTasks() throws Exception {
        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();
        tasks.setId(UUID.randomUUID().toString());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, tasks.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(tasks))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void patchWithIdMismatchTasks() throws Exception {
        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();
        tasks.setId(UUID.randomUUID().toString());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, UUID.randomUUID().toString())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(tasks))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void patchWithMissingIdPathParamTasks() throws Exception {
        int databaseSizeBeforeUpdate = tasksRepository.findAll().collectList().block().size();
        tasks.setId(UUID.randomUUID().toString());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(tasks))
            .exchange()
            .expectStatus()
            .isEqualTo(405);

        // Validate the Tasks in the database
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void deleteTasks() {
        // Initialize the database
        tasksRepository.save(tasks).block();

        int databaseSizeBeforeDelete = tasksRepository.findAll().collectList().block().size();

        // Delete the tasks
        webTestClient
            .delete()
            .uri(ENTITY_API_URL_ID, tasks.getId())
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isNoContent();

        // Validate the database contains one less item
        List<Tasks> tasksList = tasksRepository.findAll().collectList().block();
        assertThat(tasksList).hasSize(databaseSizeBeforeDelete - 1);
    }
}
