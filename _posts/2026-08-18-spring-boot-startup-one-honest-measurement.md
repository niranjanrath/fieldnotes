---
title: Cutting Spring Boot startup time, one honest measurement at a time
subtitle: Before you reach for native images, find out where the seconds actually go.
date: 2026-08-18 09:15:00 +0200
tags: [java, spring-boot, performance]
description: A measure-first approach to slow Spring Boot startups — what to log, what to lazy-load and which cheap wins to try before anything exotic.
---
"Our app takes forever to start" is a feeling, not a diagnosis. The fix for a feeling is a number — and Spring Boot will give you plenty of them if you ask.

## Step one: see the beans

Spring can record its own startup steps. Wire up a buffer and read the result at `/actuator/startup`:

```java
@SpringBootApplication
public class Application {
  public static void main(String[] args) {
    var app = new SpringApplication(Application.class);
    app.setApplicationStartup(new BufferingApplicationStartup(4096));
    app.run(args);
  }
}
```

Expose the endpoint, hit it once, and sort the steps by duration. Resist the urge to optimise anything that isn't near the top of that list.

```properties
management.endpoints.web.exposure.include=startup
```

## Step two: the cheap wins

Before anything clever, try the boring options in this order:

1. **Trim the classpath.** Starters you don't use still get auto-configured.
2. **Turn on lazy initialisation** and see what breaks.
3. **Narrow component scanning** to the packages you actually own.
4. **Check the JVM flags** — class data sharing can shave real time for free.

```properties
spring.main.lazy-initialization=true
```

Lazy init is a trade: you move cost from startup to the first request that needs a bean. For a service that must be fast on request one, that's the wrong trade; for a dev loop, it's wonderful.

## Step three: look at what's slow in *your* code

Often the culprit is a `@PostConstruct` that calls a remote service, warms a cache or runs a migration. Those aren't framework problems.

```java
@Component
class CatalogCache {
  @PostConstruct
  void warm() {
    // blocks startup until the remote call returns
    repo.loadEverything();
  }
}
```

Move that work to an `ApplicationReadyEvent` listener and the app can accept traffic sooner.

## Know when to stop

If startup is under a few seconds and you deploy a handful of times a day, you're done. Faster builds and snappier tests will pay back more than shaving another 400 milliseconds off a boot you rarely do. Measure, fix the top item, measure again — and stop when the number stops mattering.
