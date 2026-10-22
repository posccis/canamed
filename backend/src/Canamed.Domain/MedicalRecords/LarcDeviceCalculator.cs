namespace Canamed.Domain.MedicalRecords;

/// <summary>
/// Calculadora clínica de vigência e seguimento de LARCs (Long-Acting Reversible Contraception).
/// Suporta Implanon (etonogestrel), DIUs de cobre, prata e hormonais (Mirena / Kyleena).
/// </summary>
public static class LarcDeviceCalculator
{
    public static DateOnly CalculateExpirationDate(string deviceType, DateOnly insertionDate)
    {
        var type = deviceType?.Trim().ToLowerInvariant() ?? string.Empty;

        var years = type switch
        {
            "implanon" or "implante_etonogestrel" => 3,
            "diu_cobre" or "diu_tcu380a" => 10,
            "diu_prata" or "diu_prata_cobre" => 5,
            "kyleena" => 5,
            "mirena" => 8, // Bula atualizada / FEBRASGO até 8 anos para contracepção
            _ => 5
        };

        return insertionDate.AddYears(years);
    }

    public static DateOnly CalculateControlUltrasoundDate(DateOnly insertionDate)
    {
        // Protocolo FEBRASGO: USG pélvica/transvaginal de controle em 30 a 45 dias pós-inserção
        return insertionDate.AddDays(30);
    }
}
