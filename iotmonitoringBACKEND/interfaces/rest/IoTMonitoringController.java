package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest;

import com.cafemetrix.cafelab.iam.infrastructure.authorization.sfs.support.CurrentProfileIdResolver;
import com.cafemetrix.cafelab.iotmonitoring.application.internal.IoTMonitoringStatusCalculator;
import com.cafemetrix.cafelab.iotmonitoring.domain.exceptions.IoTMonitoringDataNotFoundException;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringData;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringHistory;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringDataCommand;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetIoTMonitoringDataByUserIdQuery;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetIoTMonitoringHistoriesByUserIdQuery;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetLatestIoTMonitoringHistoryByUserIdQuery;
import com.cafemetrix.cafelab.iotmonitoring.domain.services.IoTMonitoringCommandService;
import com.cafemetrix.cafelab.iotmonitoring.domain.services.IoTMonitoringQueryService;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources.*;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform.CreateIoTMonitoringDataCommandFromResourceAssembler;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform.CreateIoTMonitoringHistoryCommandFromResourceAssembler;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform.IoTMonitoringDataResourceFromEntityAssembler;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform.IoTMonitoringHistoryResourceFromEntityAssembler;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform.UpdateIoTMonitoringDataCommandFromResourceAssembler;
import com.cafemetrix.cafelab.shared.interfaces.rest.resources.MessageResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/v1/iot-monitoring", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "IoT Monitoring", description = "Endpoints de monitoreo IoT por usuario autenticado")
public class IoTMonitoringController {
    private final IoTMonitoringCommandService commandService;
    private final IoTMonitoringQueryService queryService;
    private final CurrentProfileIdResolver currentProfileIdResolver;

    public IoTMonitoringController(
            IoTMonitoringCommandService commandService,
            IoTMonitoringQueryService queryService,
            CurrentProfileIdResolver currentProfileIdResolver) {
        this.commandService = commandService;
        this.queryService = queryService;
        this.currentProfileIdResolver = currentProfileIdResolver;
    }

    private Optional<Long> resolveCurrentUserId() {
        return currentProfileIdResolver.resolveProfileId();
    }

    private ResponseEntity<?> unauthorized(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResource(message));
    }

    private IoTMonitoringData ensureDataEntityForUser(Long userId) {
        var existing = queryService.handle(new GetIoTMonitoringDataByUserIdQuery(userId));
        if (existing.isPresent()) {
            return existing.get();
        }

        var defaultCommand = new CreateIoTMonitoringDataCommand(userId, true, true, 18.0, 24.0, 50.0, 65.0);
        return commandService
                .handle(defaultCommand)
                .orElseThrow(() -> new IllegalStateException("No se pudo crear configuración IoT por defecto"));
    }

    private IoTMonitoringDashboardResource buildDashboard(Long userId, int limit) {
        IoTMonitoringData dataEntity = ensureDataEntityForUser(userId);
        IoTMonitoringDataResource monitoringData =
                IoTMonitoringDataResourceFromEntityAssembler.toResourceFromEntity(dataEntity);

        Optional<IoTMonitoringHistory> latestEntity =
                queryService.handle(new GetLatestIoTMonitoringHistoryByUserIdQuery(userId));
        IoTMonitoringHistoryResource currentReading =
                latestEntity.map(IoTMonitoringHistoryResourceFromEntityAssembler::toResourceFromEntity).orElse(null);

        var history =
                queryService.handle(new GetIoTMonitoringHistoriesByUserIdQuery(userId, limit)).stream()
                        .map(IoTMonitoringHistoryResourceFromEntityAssembler::toResourceFromEntity)
                        .collect(Collectors.toList());

        IoTMonitoringHistory latest = latestEntity.orElse(null);
        String sensorStatus = IoTMonitoringStatusCalculator.sensorStatus(dataEntity, latest);
        String environmentalStatus = IoTMonitoringStatusCalculator.environmentalStatus(dataEntity, latest);
        String dehumidifierStatus = IoTMonitoringStatusCalculator.dehumidifierStatus(dataEntity, latest);
        var activeAlerts = IoTMonitoringStatusCalculator.activeAlerts(dataEntity, latest);

        return new IoTMonitoringDashboardResource(
                monitoringData,
                currentReading,
                history,
                sensorStatus,
                environmentalStatus,
                dehumidifierStatus,
                activeAlerts);
    }

    @PostMapping(value = "/data", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Crear configuración IoT (userId desde JWT)")
    public ResponseEntity<?> createData(@Valid @RequestBody CreateIoTMonitoringDataResource resource) {
        Optional<Long> userIdOpt = resolveCurrentUserId();
        if (userIdOpt.isEmpty()) {
            return unauthorized("Usuario no autenticado o perfil no encontrado");
        }
        try {
            var command = CreateIoTMonitoringDataCommandFromResourceAssembler.toCommand(userIdOpt.get(), resource);
            var created = commandService.handle(command);
            if (created.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResource("No se pudo crear la configuración IoT"));
            }
            return new ResponseEntity<>(
                    IoTMonitoringDataResourceFromEntityAssembler.toResourceFromEntity(created.get()),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new MessageResource(ex.getMessage()));
        }
    }

    @GetMapping("/data")
    @Operation(summary = "Obtener configuración IoT del usuario autenticado")
    public ResponseEntity<?> getData() {
        Optional<Long> userIdOpt = resolveCurrentUserId();
        if (userIdOpt.isEmpty()) {
            return unauthorized("Usuario no autenticado o perfil no encontrado");
        }
        var entity = ensureDataEntityForUser(userIdOpt.get());
        return ResponseEntity.ok(IoTMonitoringDataResourceFromEntityAssembler.toResourceFromEntity(entity));
    }

    @PutMapping(value = "/data/{dataId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Actualizar configuración IoT (solo del propio usuario)")
    public ResponseEntity<?> updateData(
            @PathVariable Long dataId,
            @Valid @RequestBody UpdateIoTMonitoringDataResource resource) {
        Optional<Long> userIdOpt = resolveCurrentUserId();
        if (userIdOpt.isEmpty()) {
            return unauthorized("Usuario no autenticado o perfil no encontrado");
        }
        try {
            var command =
                    UpdateIoTMonitoringDataCommandFromResourceAssembler.toCommand(
                            dataId,
                            userIdOpt.get(),
                            resource);
            var updated = commandService.handle(command);
            if (updated.isEmpty()) {
                throw new IoTMonitoringDataNotFoundException(dataId);
            }
            return ResponseEntity.ok(IoTMonitoringDataResourceFromEntityAssembler.toResourceFromEntity(updated.get()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new MessageResource(ex.getMessage()));
        }
    }

    @PostMapping(value = "/histories", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Registrar lectura IoT para el usuario autenticado")
    public ResponseEntity<?> createHistory(@Valid @RequestBody CreateIoTMonitoringHistoryResource resource) {
        Optional<Long> userIdOpt = resolveCurrentUserId();
        if (userIdOpt.isEmpty()) {
            return unauthorized("Usuario no autenticado o perfil no encontrado");
        }
        ensureDataEntityForUser(userIdOpt.get());
        var command = CreateIoTMonitoringHistoryCommandFromResourceAssembler.toCommand(userIdOpt.get(), resource);
        var created = commandService.handle(command);
        if (created.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResource("No se pudo registrar la lectura IoT"));
        }
        return new ResponseEntity<>(
                IoTMonitoringHistoryResourceFromEntityAssembler.toResourceFromEntity(created.get()),
                HttpStatus.CREATED);
    }

    @GetMapping("/histories")
    @Operation(summary = "Listar historial IoT del usuario autenticado")
    public ResponseEntity<?> listHistories(@RequestParam(defaultValue = "20") int limit) {
        Optional<Long> userIdOpt = resolveCurrentUserId();
        if (userIdOpt.isEmpty()) {
            return unauthorized("Usuario no autenticado o perfil no encontrado");
        }
        var histories = queryService.handle(new GetIoTMonitoringHistoriesByUserIdQuery(userIdOpt.get(), limit));
        var resources = histories.stream()
                .map(IoTMonitoringHistoryResourceFromEntityAssembler::toResourceFromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(resources);
    }

    @PostMapping("/simulator/generate-reading")
    @Operation(summary = "Simula una lectura: genera valores en servidor y persiste historial")
    public ResponseEntity<?> generateSimulatedReading() {
        Optional<Long> userIdOpt = resolveCurrentUserId();
        if (userIdOpt.isEmpty()) {
            return unauthorized("Usuario no autenticado o perfil no encontrado");
        }
        Long userId = userIdOpt.get();
        ensureDataEntityForUser(userId);
        var readingOpt = commandService.simulateReading(userId);
        if (readingOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResource("No se pudo generar la lectura simulada"));
        }
        IoTMonitoringHistory reading = readingOpt.get();
        IoTMonitoringData data =
                queryService
                        .handle(new GetIoTMonitoringDataByUserIdQuery(userId))
                        .orElseThrow();
        return ResponseEntity.ok(
                new IoTSimulatorReadingResource(
                        reading.getTemperature(),
                        reading.getHumidity(),
                        IoTMonitoringStatusCalculator.environmentalStatus(data, reading),
                        IoTMonitoringStatusCalculator.dehumidifierStatus(data, reading),
                        "Lectura simulada generada y guardada correctamente."));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard IoT con estados y alertas calculados en servidor")
    public ResponseEntity<?> getDashboard(@RequestParam(defaultValue = "20") int limit) {
        Optional<Long> userIdOpt = resolveCurrentUserId();
        if (userIdOpt.isEmpty()) {
            return unauthorized("Usuario no autenticado o perfil no encontrado");
        }
        return ResponseEntity.ok(buildDashboard(userIdOpt.get(), limit));
    }
}
